package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.ChatMessage;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.entity.Notification;
import com.example.backend_main.common.repository.ChatMessageRepository;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.repository.NotificationRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.dto.ChatMessageDTO;
import com.example.backend_main.dto.ChatRoomRequestResultDTO;
import com.example.backend_main.ky.entity.Review;
import com.example.backend_main.ky.repository.ReviewRepository;
import com.example.backend_main.dto.ChatRoomDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate; // ★ 추가됨
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap; // ★ 추가됨
import java.util.List;
import java.util.Locale;
import java.util.Map; // ★ 추가됨
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class ChatService {
        private static final Set<String> ALLOWED_CHAT_FILE_EXTENSIONS = Set.of(
                        "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico",
                        "pdf", "doc", "docx", "xls", "xlsx"
        );

        private static final Set<String> ALLOWED_CHAT_FILE_MIME_TYPES = Set.of(
                        "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp", "image/svg+xml", "image/x-icon",
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "application/vnd.ms-excel",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        private static final Set<String> IMAGE_EXTENSIONS = Set.of(
                        "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"
        );

        private final ChatRoomRepository chatRoomRepository;
        private final ChatMessageRepository chatMessageRepository;

        // ★ [알림용 1] 웹소켓으로 특정 유저에게 데이터를 쏘기 위한 템플릿
        private final SimpMessagingTemplate messagingTemplate;

        private final UserRepository userRepository;

        // ★ [알림용 2] DB에 알림 저장하기 위한 Repository (이건 네가 만들어야 함!)
        private final NotificationRepository notificationRepository;

        private final org.apache.tika.Tika tika = new org.apache.tika.Tika();
        private final CalendarEventRepository calendarEventRepository;
        private final ReviewRepository reviewRepository;

        @Value("${chat.file.upload-dir}")
        private String uploadDir;

        @Value("${chat.file.server-url}")
        private String serverUrl;

        /**
         * 동일 (의뢰인, 변호사) 쌍에 대해 대기(ST01)·진행(ST02) 방이 이미 있으면 그 roomId만 반환하고,
         * 없을 때만 새 방을 만들고 알림을 보낸다. (완료·종료·숨김 ST99 후에는 새로 신청 가능)
         */
        @Transactional
        public ChatRoomRequestResultDTO requestOrReuseActiveConsultationRoom(Long userNo, Long lawyerNo) {
                Optional<ChatRoom> existing = chatRoomRepository
                                .findFirstByUserNoAndLawyerNoAndProgressCodeInOrderByRegDtDesc(
                                                userNo, lawyerNo, List.of("ST01", "ST02"));
                if (existing.isPresent()) {
                        ChatRoom r = existing.get();
                        return ChatRoomRequestResultDTO.builder()
                                        .roomId(r.getRoomId())
                                        .userNo(r.getUserNo())
                                        .lawyerNo(r.getLawyerNo())
                                        .progressCode(r.getProgressCode())
                                        .newlyCreated(false)
                                        .build();
                }
                String roomId = requestChat(userNo, lawyerNo);
                ChatRoom saved = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));
                return ChatRoomRequestResultDTO.builder()
                                .roomId(roomId)
                                .userNo(saved.getUserNo())
                                .lawyerNo(saved.getLawyerNo())
                                .progressCode(saved.getProgressCode())
                                .newlyCreated(true)
                                .build();
        }

        // ------------------------------------------------------------------
        // 1. 의뢰인이 상담 요청 (방은 생기지만 대기 상태) + [양측에 알림]
        // ------------------------------------------------------------------
        @Transactional
        public String requestChat(Long userNo, Long lawyerNo) {
                String roomId = UUID.randomUUID().toString(); // 랜덤 방 ID 생성
                ChatRoom room = ChatRoom.builder()
                                .roomId(roomId)
                                .userNo(userNo)
                                .lawyerNo(lawyerNo)
                                .progressCode("ST01") // 팩트 : 처음엔 '대기' 상태로 박기
                                .build();
                chatRoomRepository.save(room);

                // ★ [핵심 1] DB에서 진짜 이름들 꺼내오기
                String clientName = userRepository.findById(userNo)
                                .map(com.example.backend_main.common.entity.User::getUserNm)
                                .orElse("의뢰인");
                String lawyerName = userRepository.findById(lawyerNo)
                                .map(com.example.backend_main.common.entity.User::getUserNm)
                                .orElse("담당");

                // =========================================================
                // ★ [알림 로직 1] 변호사에게 쏘는 알림 ("의뢰인님이 요청했습니다")
                // =========================================================
                String lawyerTitle = "상담 요청";
                String lawyerContent = clientName + "님이 1:1 채팅을 요청하였습니다.";

                Notification lawyerNoti = Notification.builder()
                                .userNo(lawyerNo) // 타겟: 변호사
                                .msgTitle(lawyerTitle)
                                .msgContent(lawyerContent)
                                .roomId(roomId)
                                .readYn("N")
                                .build();
                notificationRepository.save(lawyerNoti);

                // 변호사 웹소켓 발사 (roomId 포함해 알림 클릭 시 해당 채팅방으로 이동)
                Map<String, String> lawyerNotiData = new HashMap<>();
                lawyerNotiData.put("title", lawyerTitle);
                lawyerNotiData.put("content", lawyerContent);
                lawyerNotiData.put("roomId", roomId);
                messagingTemplate.convertAndSend("/sub/user/" + lawyerNo + "/notification", lawyerNotiData);

                // =========================================================
                // ★ [알림 로직 2] 일반 유저(본인)에게 남기는 기록용 알림 (클릭 시 해당 채팅방 이동용 roomId 포함)
                // =========================================================
                String clientTitle = "요청 완료";
                String clientContent = lawyerName + " 변호사에게 1:1 채팅을 요청하였습니다.";

                Notification clientNoti = Notification.builder()
                                .userNo(userNo)
                                .msgTitle(clientTitle)
                                .msgContent(clientContent)
                                .roomId(roomId)
                                .readYn("N")
                                .build();
                notificationRepository.save(clientNoti);

                // 일반 유저 웹소켓 발사 (roomId 포함해 알림 클릭 시 해당 채팅방으로 이동 가능)
                Map<String, String> clientNotiData = new HashMap<>();
                clientNotiData.put("title", clientTitle);
                clientNotiData.put("content", clientContent);
                clientNotiData.put("roomId", roomId);
                messagingTemplate.convertAndSend("/sub/user/" + userNo + "/notification", clientNotiData);

                return roomId;
        }

        /** 기존 채팅방에 대한 1:1 채팅 요청 알림 전송 (전문가찾기/상담게시판에서 방 생성 시 호출용) */
        @Transactional
        public void sendChatRequestNotificationsForRoom(String roomId, Long userNo, Long lawyerNo) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("존재하지 않는 채팅방입니다."));
                if (!room.getUserNo().equals(userNo) || !room.getLawyerNo().equals(lawyerNo)) {
                        throw new RuntimeException("해당 방의 참여자가 아닙니다.");
                }
                String clientName = userRepository.findById(userNo)
                                .map(com.example.backend_main.common.entity.User::getUserNm)
                                .orElse("의뢰인");
                String lawyerName = userRepository.findById(lawyerNo)
                                .map(com.example.backend_main.common.entity.User::getUserNm)
                                .orElse("담당 변호사");

                // 변호사에게: "OOO님이 1:1 채팅을 요청하였습니다."
                String lawyerTitle = "상담 요청";
                String lawyerContent = clientName + "님이 1:1 채팅을 요청하였습니다.";
                Notification lawyerNoti = Notification.builder()
                                .userNo(lawyerNo)
                                .msgTitle(lawyerTitle)
                                .msgContent(lawyerContent)
                                .roomId(roomId)
                                .readYn("N")
                                .build();
                notificationRepository.save(lawyerNoti);
                Map<String, String> lawyerNotiData = new HashMap<>();
                lawyerNotiData.put("title", lawyerTitle);
                lawyerNotiData.put("content", lawyerContent);
                lawyerNotiData.put("roomId", roomId);
                messagingTemplate.convertAndSend("/sub/user/" + lawyerNo + "/notification", lawyerNotiData);

                // 일반인에게: "OOO 변호사에게 1:1 채팅을 요청하였습니다."
                String clientTitle = "요청 완료";
                String clientContent = lawyerName + " 변호사에게 1:1 채팅을 요청하였습니다.";
                Notification clientNoti = Notification.builder()
                                .userNo(userNo)
                                .msgTitle(clientTitle)
                                .msgContent(clientContent)
                                .roomId(roomId)
                                .readYn("N")
                                .build();
                notificationRepository.save(clientNoti);
                Map<String, String> clientNotiData = new HashMap<>();
                clientNotiData.put("title", clientTitle);
                clientNotiData.put("content", clientContent);
                clientNotiData.put("roomId", roomId);
                messagingTemplate.convertAndSend("/sub/user/" + userNo + "/notification", clientNotiData);
        }

        // ------------------------------------------------------------------
        // 2. 메시지 저장 로직 + [상대방에게 알림] (이게 빠져서 터진 거임)
        // ------------------------------------------------------------------
        @Transactional
        public void saveMessage(ChatMessageDTO dto) {
                // ① 메시지 DB에 저장
                ChatMessage msg = ChatMessage.builder()
                                .roomId(dto.getRoomId())
                                .senderNo(dto.getSenderNo())
                                .message(dto.getMessage())
                                .msgType(dto.getMsgType() != null ? dto.getMsgType() : "TEXT")
                                .fileUrl(dto.getFileUrl())
                                .build();
                chatMessageRepository.save(msg);

                // ② 알림 로직 (상대방 번호 찾아서 쏘기)
                ChatRoom room = chatRoomRepository.findById(dto.getRoomId()).orElse(null);
                if (room != null && !"FILE".equals(dto.getMsgType())) {
                        Long targetUserNo = dto.getSenderNo().equals(room.getUserNo()) ? room.getLawyerNo()
                                        : room.getUserNo();

                        String title = "새 메시지";
                        String content = dto.getMessage();

                        String senderName = userRepository.findById(dto.getSenderNo())
                                        .map(com.example.backend_main.common.entity.User::getUserNm)
                                        .orElse("알 수 없는 유저");

                        Notification noti = Notification.builder()
                                        .userNo(targetUserNo)
                                        .msgTitle(senderName) // "홍길동" 이라고 들어감
                                        .msgContent(dto.getMessage()) // 채팅 내용
                                        .roomId(dto.getRoomId()) // ★ 이거 꽂아줘야 프론트에서 이동 가능!
                                        .readYn("N")
                                        .build();
                        notificationRepository.save(noti);

                        Map<String, String> notiData = new HashMap<>();
                        notiData.put("title", senderName);
                        notiData.put("content", content);
                        notiData.put("roomId", dto.getRoomId()); // ✅ 이거 추가
                        messagingTemplate.convertAndSend("/sub/user/" + targetUserNo + "/notification", notiData);
                }
        }

        // ------------------------------------------------------------------
        // 3. 이전 채팅 내역 조회 (수정 없음)
        // ------------------------------------------------------------------
        public List<ChatMessageDTO> getChatHistory(String roomId, Long reqUserNo) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("존재하지 않는 채팅방입니다."));

                if (!room.getUserNo().equals(reqUserNo) && !room.getLawyerNo().equals(reqUserNo)) {
                        throw new RuntimeException("이 방의 채팅 내역을 볼 권한이 없습니다.");
                }

                return chatMessageRepository.findByRoomIdOrderBySendDtAsc(roomId).stream()
                                .map(msg -> ChatMessageDTO.builder()
                                                .roomId(msg.getRoomId())
                                                .senderNo(msg.getSenderNo())
                                                .message(msg.getMessage())
                                                .msgType(msg.getMsgType())
                                                .fileUrl(msg.getFileUrl())
                                                .sendDt(msg.getSendDt())
                                                .build())
                                .collect(Collectors.toList());
        }

        /** 페이지네이션: 최신 size개 또는 before 이전 size개 조회 (스크롤 올릴 때 이전 메시지용) */
        public List<ChatMessageDTO> getChatHistoryPaged(String roomId, Long reqUserNo, int size, LocalDateTime before) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("존재하지 않는 채팅방입니다."));
                if (!room.getUserNo().equals(reqUserNo) && !room.getLawyerNo().equals(reqUserNo)) {
                        throw new RuntimeException("이 방의 채팅 내역을 볼 권한이 없습니다.");
                }
                PageRequest page = PageRequest.of(0, Math.min(size, 100));
                List<ChatMessage> list;
                if (before == null) {
                        list = chatMessageRepository.findByRoomIdOrderBySendDtDesc(roomId, page);
                        Collections.reverse(list);
                } else {
                        list = chatMessageRepository.findByRoomIdAndSendDtBeforeOrderBySendDtDesc(roomId, before, page);
                        Collections.reverse(list);
                }
                return list.stream()
                                .map(msg -> ChatMessageDTO.builder()
                                                .roomId(msg.getRoomId())
                                                .senderNo(msg.getSenderNo())
                                                .message(msg.getMessage())
                                                .msgType(msg.getMsgType())
                                                .fileUrl(msg.getFileUrl())
                                                .sendDt(msg.getSendDt())
                                                .build())
                                .collect(Collectors.toList());
        }

        // ------------------------------------------------------------------
        // 4. 변호사가 상담 수락 (수정 없음)
        // ------------------------------------------------------------------
        @Transactional
        public void acceptChat(String roomId, Long lawyerNo) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("방이 존재하지 않습니다."));

                if (!room.getLawyerNo().equals(lawyerNo)) {
                        throw new RuntimeException("등록되지 않은 접근입니다.");
                }

                room.setProgressCode("ST02");

                // ✅ 추가: 상태 변경을 방 전체에 브로드캐스트
                ChatMessageDTO statusMsg = ChatMessageDTO.builder()
                                .roomId(roomId)
                                .msgType("STATUS_CHANGE")
                                .message("ST02")
                                .build();
                messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, statusMsg);
        }

        // ------------------------------------------------------------------
        // 5. 내 채팅방 목록 조회 — 최근 메시지 온 순서로 정렬
        // ------------------------------------------------------------------
        public List<ChatRoomDTO> getMyChatRooms(Long myUserNo) {
                List<ChatRoomDTO> list = chatRoomRepository.findByUserNoOrLawyerNoOrderByRegDtDesc(myUserNo, myUserNo).stream()
                                .filter(room -> !"ST99".equals(room.getProgressCode()))
                                .map(room -> {
                                        String clientName = userRepository.findById(room.getUserNo())
                                                        .map(u -> u.getUserNm()).orElse("알 수 없는 유저");
                                        String lawyerName = userRepository.findById(room.getLawyerNo())
                                                        .map(u -> u.getUserNm() + " 변호사").orElse("알 수 없는 변호사");

                                        var lastMsgOpt = chatMessageRepository.findTopByRoomIdOrderBySendDtDesc(room.getRoomId());
                                        String lastMsg = lastMsgOpt
                                                        .map(msg -> "FILE".equals(msg.getMsgType()) ? "[파일이 전송되었습니다]"
                                                                        : msg.getMessage())
                                                        .orElse("대화를 시작하세요...");
                                        java.time.LocalDateTime lastMessageAt = lastMsgOpt
                                                        .map(com.example.backend_main.common.entity.ChatMessage::getSendDt)
                                                        .orElse(room.getRegDt());

                                        return ChatRoomDTO.builder()
                                                        .roomId(room.getRoomId())
                                                        .userNo(room.getUserNo())
                                                        .lawyerNo(room.getLawyerNo())
                                                        .progressCode(room.getProgressCode())
                                                        .userNm(clientName)
                                                        .lawyerName(lawyerName)
                                                        .lastMessage(lastMsg)
                                                        .lastMessageAt(lastMessageAt)
                                                        .build();
                                })
                                .collect(Collectors.toList());
                list.sort(java.util.Comparator.comparing(ChatRoomDTO::getLastMessageAt,
                                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
                return list;
        }

        @Transactional
        public void uploadChatFile(String roomId, Long senderNo, MultipartFile file) {
                try {
                        if (file.isEmpty())
                                throw new RuntimeException("파일이 비어있습니다.");

                        String originName = file.getOriginalFilename();
                        if (originName == null || originName.isBlank())
                                throw new RuntimeException("파일 이름이 없습니다.");
                        validateChatUploadFile(file, originName);

                        File dir = new File(uploadDir);
                        if (!dir.exists())
                                dir.mkdirs();

                        String savedName = UUID.randomUUID().toString() + "_" + originName;

                        File dest = new File(uploadDir, savedName);
                        file.transferTo(dest);

                        // serverUrl에 슬래시가 이미 붙어 있어도, 중복 // 이 생기지 않도록 정규화
                        String baseUrl = serverUrl.endsWith("/") ? serverUrl.substring(0, serverUrl.length() - 1) : serverUrl;
                        String fileUrl = baseUrl + "/api/chat/files/download/" + savedName;

                        ChatMessageDTO msgDto = ChatMessageDTO.builder()
                                        .roomId(roomId)
                                        .senderNo(senderNo)
                                        .message(originName)
                                        .msgType("FILE")
                                        .fileUrl(fileUrl)
                                        .build();

                        saveMessage(msgDto);
                        messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, msgDto);

                } catch (IOException e) {
                        throw new RuntimeException("Z드라이브 파일 저장 실패: " + e.getMessage());
                }
        }

        private void validateChatUploadFile(MultipartFile file, String originName) throws IOException {
                if (originName.contains("..")) {
                        throw new RuntimeException("잘못된 파일명입니다.");
                }

                int dotIdx = originName.lastIndexOf(".");
                if (dotIdx < 0 || dotIdx == originName.length() - 1) {
                        throw new RuntimeException("확장자가 없는 파일은 업로드할 수 없습니다.");
                }

                String extension = originName.substring(dotIdx + 1).toLowerCase(Locale.ROOT);
                if (!ALLOWED_CHAT_FILE_EXTENSIONS.contains(extension)) {
                        throw new RuntimeException("허용되지 않는 확장자입니다. (jpg, jpeg, png, gif, bmp, webp, svg, ico, pdf, doc, docx, xls, xlsx)");
                }

                String declaredMime = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";
                String detectedMime = tika.detect(file.getInputStream()).toLowerCase(Locale.ROOT);

                boolean isImageFile = IMAGE_EXTENSIONS.contains(extension);
                if (isImageFile) {
                        boolean imageMimeOk = declaredMime.startsWith("image/")
                                        || detectedMime.startsWith("image/")
                                        || "application/octet-stream".equals(declaredMime);
                        if (!imageMimeOk) {
                                throw new RuntimeException("이미지 파일 형식이 올바르지 않습니다.");
                        }
                        return;
                }

                boolean mimeAllowed = ALLOWED_CHAT_FILE_MIME_TYPES.contains(declaredMime)
                                || ALLOWED_CHAT_FILE_MIME_TYPES.contains(detectedMime);
                if (!mimeAllowed) {
                        throw new RuntimeException("허용되지 않는 파일 형식입니다.");
                }
        }

        // 파라미터에 boolean isDownload 추가됨!
        public ResponseEntity<Resource> downloadChatFile(String fileName, boolean isDownload) {
                try {
                        Path filePath = Paths.get(uploadDir).resolve(fileName).normalize();
                        Resource resource = new UrlResource(filePath.toUri());

                        if (!resource.exists() || !resource.isReadable()) {
                                return ResponseEntity.notFound().build();
                        }

                        String contentType;
                        try {
                                contentType = tika.detect(filePath);
                        } catch (IOException e) {
                                contentType = "application/octet-stream";
                        }

                        String originName = fileName.substring(fileName.indexOf("_") + 1);
                        String encodedName = UriUtils.encode(originName, StandardCharsets.UTF_8);

                        // ★ [핵심] isDownload가 true면 강제 다운로드(attachment), false면 미리보기(inline)
                        String dispositionType = isDownload ? "attachment" : "inline";

                        return ResponseEntity.ok()
                                        .contentType(MediaType.parseMediaType(contentType))
                                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                                        dispositionType + "; filename=\"" + encodedName + "\"")
                                        .body(resource);
                } catch (MalformedURLException e) {
                        return ResponseEntity.badRequest().build();
                }
        }

        // 1. 상담 종료 로직
        @Transactional
        public void closeChat(String roomId, Long lawyerNo) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("방이 존재하지 않습니다."));
                if (!room.getLawyerNo().equals(lawyerNo)) {
                        throw new RuntimeException("변호사만 종료할 수 있습니다.");
                }
                room.setProgressCode("ST05"); // 종료 상태로 변경

                ChatMessageDTO statusMsg = ChatMessageDTO.builder()
                                .roomId(roomId)
                                .msgType("STATUS_CHANGE")
                                .message("ST05")
                                .build();
                messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, statusMsg);
        }

        /** 상담 종료(ST05)된 방에서 의뢰인이 해당 변호사에게 리뷰 등록 */
        @Transactional
        public void submitReview(String roomId, Long writerNo, double rating, String content) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("방이 없습니다."));
                if (!room.getUserNo().equals(writerNo))
                        throw new RuntimeException("의뢰인만 리뷰를 작성할 수 있습니다.");
                if (!"ST05".equals(room.getProgressCode()))
                        throw new RuntimeException("상담이 종료된 후에만 리뷰를 작성할 수 있습니다.");
                Long lawyerNo = room.getLawyerNo();
                if (lawyerNo == null) throw new RuntimeException("변호사 정보가 없습니다.");
                Review review = Review.builder()
                                .lawyerNo(lawyerNo)
                                .writerNo(writerNo)
                                .stars(rating)
                                .content(content != null ? content.trim() : "")
                                .replyNo(null)
                                .build();
                reviewRepository.save(review);
        }

        // 2. 캘린더 동시 저장 로직 — 요청자가 해당 방 의뢰인/변호사인지 검증, 날짜 검증
        @Transactional
        public void confirmSchedule(String roomId, String dateStr, Long requesterUserNo) {
                if (dateStr == null || dateStr.isBlank())
                        throw new IllegalArgumentException("날짜가 필요합니다.");
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("방이 없습니다."));
                if (!room.getUserNo().equals(requesterUserNo) && !room.getLawyerNo().equals(requesterUserNo))
                        throw new RuntimeException("이 채팅방의 일정을 확정할 권한이 없습니다.");

                String clientName = userRepository.findById(room.getUserNo())
                                .map(com.example.backend_main.common.entity.User::getUserNm).orElse("의뢰인");
                String lawyerName = userRepository.findById(room.getLawyerNo())
                                .map(com.example.backend_main.common.entity.User::getUserNm).orElse("담당");

                // [초심자 핵심] 양측 캘린더에 일정을 박아준다.
                // 변호사 달력에 추가 (의뢰인 이름 표시)
                CalendarEvent lawyerEvent = CalendarEvent.builder()
                                .roomId(roomId)
                                .userNo(room.getLawyerNo())
                                .lawyerNo(room.getLawyerNo())
                                .title(clientName + "님과의 1:1 면담")
                                .startDate(dateStr)
                                .colorCode("#f59e0b") // 주황색
                                .build();
                calendarEventRepository.save(lawyerEvent);

                // 의뢰인 달력에 추가 (변호사 이름 표시)
                CalendarEvent clientEvent = CalendarEvent.builder()
                                .roomId(roomId)
                                .userNo(room.getUserNo())
                                .lawyerNo(room.getLawyerNo())
                                .title(lawyerName + " 변호사 면담")
                                .startDate(dateStr)
                                .colorCode("#3b82f6") // 파란색
                                .build();
                calendarEventRepository.save(clientEvent);

                if ("ST01".equals(room.getProgressCode())) {
                        room.setProgressCode("ST02");
                }
        }

        @Transactional
        public void rejectSchedule(String roomId, String dateStr, String reason, Long requesterUserNo) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("방이 없습니다."));
                if (!room.getUserNo().equals(requesterUserNo) && !room.getLawyerNo().equals(requesterUserNo)) {
                        throw new RuntimeException("이 채팅방의 일정을 거절할 권한이 없습니다.");
                }

                String rejectText;
                if (reason == null || reason.isBlank()) {
                        rejectText = "상대방이 일정 제안을 거절하였습니다.";
                } else {
                        String trimmed = reason.trim();

                        // 사용자가 "사유로"처럼 조사까지 입력했을 수도 있으니, 끝글자가 이미 '로/으로'면 중복 처리 방지.
                        if (trimmed.endsWith("으로") || trimmed.endsWith("로")) {
                                rejectText = trimmed + " 거절하였습니다.";
                        } else {
                                String particle = chooseParticleForEuRo(trimmed); // 로/으로 자동 선택
                                rejectText = trimmed + particle + " 거절하였습니다.";
                        }
                }

                ChatMessageDTO rejectMsg = ChatMessageDTO.builder()
                                .roomId(roomId)
                                .senderNo(requesterUserNo)
                                .msgType("TEXT")
                                .message(rejectText)
                                .build();
                saveMessage(rejectMsg);
                messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, rejectMsg);
        }

        /**
         * 입력 사유 끝이 받침이 있으면 "으로", 없으면 "로"를 붙여 자연스럽게 만든다.
         * (예: "시간" -> 시간으로, "가능" -> 가능으로, "괜찮"같이 한글 음절 기준이 애매한 경우는 기본적으로 "로")
         */
        private String chooseParticleForEuRo(String text) {
                if (text == null || text.isBlank()) return "로";
                char last = text.charAt(text.length() - 1);

                // 한글 음절(가~힣)인지 판별해서 받침 유무로 로/으로 결정
                if (last >= '가' && last <= '힣') {
                        int syllableIndex = last - '가';
                        int jongseongIndex = syllableIndex % 28;
                        return jongseongIndex == 0 ? "로" : "으로";
                }
                // 한글이 아니면 기본 "로"
                return "로";
        }

}