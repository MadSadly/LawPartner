package com.example.backend_main.KimMinSu;

import com.example.backend_main.BWJ.BoardReplyRepository;
import com.example.backend_main.BWJ.BoardRepository;
import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.ky.entity.Review;
import com.example.backend_main.ky.repository.ReviewRepository;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.GeneralMyPageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // ★ DB 관리자들을 데려오기 위해 필수!
public class GeneralMyPageService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final ChatRoomRepository chatRoomRepository;

    // ★ 방금 만든 캘린더 관리자 추가!
    private final CalendarEventRepository calendarEventRepository;
    private final BoardReplyRepository boardReplyRepository;
    private final ReviewRepository reviewRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private final Aes256Util aes256Util;
    private final HashUtil hashUtil;


    @org.springframework.beans.factory.annotation.Value("${file.profile.upload-dir}")
    private String profileUploadDir;

    public GeneralMyPageDTO getDashboardData(Long userNo) {
        GeneralMyPageDTO dto = new GeneralMyPageDTO();

        // 1. [DB 연동] 유저 이름 가져오기
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("해당 유저를 찾을 수 없습니다."));
        dto.setUserName(user.getUserNm());
        dto.setNickName(user.getNickNm() != null ? user.getNickNm() : user.getUserNm());
        dto.setProfileImage(user.getProfileImg());


        // 3. [DB 연동] 내 상담 요청 내역 진짜로 가져오기
        List<ChatRoom> myChatRooms = chatRoomRepository.findByUserNoOrderByRegDtDesc(userNo); // 리포지토리에 이 메서드 만들어야 됨

        List<GeneralMyPageDTO.ConsultationItemDTO> consultList = myChatRooms.stream()
                .filter(room -> !"ST99".equals(room.getProgressCode()))
                .map(room -> {
            GeneralMyPageDTO.ConsultationItemDTO item = new GeneralMyPageDTO.ConsultationItemDTO();

            item.setRoomId(room.getRoomId());

            String lawyerName = "매칭 대기중";

            if (room.getLawyerNo() != null) {
                // userRepository를 통해 변호사의 User 정보를 팩트 체크함
                lawyerName = userRepository.findById(room.getLawyerNo())
                        .map(u -> u.getUserNm() + " 변호사") // 이름 뒤에 '변호사' 칭호 붙여주는 게 국룰
                        .orElse("퇴사한 변호사"); // 혹시 유저 정보가 없으면 예외 처리
            }

            item.setLawyerName(lawyerName);
            item.setCategory("일반상담");

            // ST01=대기, ST02=상담중, ST03=완료
            if ("ST01".equals(room.getProgressCode())) item.setStatus("대기");
            else if ("ST02".equals(room.getProgressCode())) item.setStatus("상담중");
            else item.setStatus("완료");

            // 날짜는 String으로 임시 처리
            item.setRegDate(room.getRegDt() != null ? room.getRegDt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : "날짜 미상");
            return item;
        }).collect(Collectors.toList());

        dto.setRecentConsultations(consultList);

        // 4. [DB 연동] 최근 내 게시판 목록 가져오기 (방금 1단계에서 만든 명령어 사용)
        List<Board> myBoards = boardRepository.findTop5ByWriterNoOrderByRegDtDesc(userNo);

        List<GeneralMyPageDTO.MyBoardDTO> postList = myBoards.stream().map(board -> {
            GeneralMyPageDTO.MyBoardDTO postDTO = new GeneralMyPageDTO.MyBoardDTO();
            postDTO.setBoardNo(board.getBoardNo());
            postDTO.setTitle(board.getTitle());
            // 날짜 형식 예쁘게 변환
            if(board.getRegDt() != null) {
                postDTO.setRegDate(board.getRegDt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            }

            int replyCount = boardReplyRepository.countByBoardNo(board.getBoardNo());
            postDTO.setReplyCount(replyCount);

            return postDTO;
        }).collect(Collectors.toList());

        dto.setRecentPosts(postList);

        // 5. 캘린더 일정 (추후 연동, 일단 빈 배열)

        LocalDateTime today = LocalDateTime.now();
        String yearMonthPrefix = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        List<CalendarEvent> myEvents = calendarEventRepository.findByUserNoAndStartDateStartingWith(userNo, yearMonthPrefix);

        List<GeneralMyPageDTO.CalendarEventDTO> eventList = myEvents.stream().map(event -> {
            GeneralMyPageDTO.CalendarEventDTO calDTO = new GeneralMyPageDTO.CalendarEventDTO();

            // 1. 방금 DTO에 추가한 ID 꽂아주기 (필수)
            calDTO.setId(event.getEventNo()); // ★ ID 꽂아주기
            calDTO.setTitle(event.getTitle()); // ★ "[개인]" 떼고 깔끔하게 제목만
            calDTO.setStart(event.getStartDate());
            calDTO.setBackgroundColor(event.getColorCode());
            return calDTO;
        }).collect(Collectors.toList());

        dto.setCalendarEvents(eventList);

        // 6. 내가 적은 리뷰 (작성자 기준 최신순, 상위 10건)
        List<Review> myReviewList = reviewRepository.findByWriterNoOrderByRegDtDesc(userNo);
        List<GeneralMyPageDTO.MyReviewDTO> reviewDtoList = myReviewList.stream()
                .limit(10)
                .map(r -> {
                    GeneralMyPageDTO.MyReviewDTO rd = new GeneralMyPageDTO.MyReviewDTO();
                    rd.setReviewNo(r.getReviewNo());
                    rd.setLawyerNo(r.getLawyerNo());
                    rd.setLawyerName(userRepository.findById(r.getLawyerNo())
                            .map(u -> u.getUserNm() + " 변호사")
                            .orElse("변호사"));
                    rd.setStars(r.getStars());
                    rd.setContent(r.getContent() != null ? r.getContent() : "");
                    rd.setRegDate(r.getRegDt() != null ? r.getRegDt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : "");
                    return rd;
                })
                .collect(Collectors.toList());
        dto.setMyReviews(reviewDtoList);

        // 이메일/휴대폰: null·빈값 방지, 복호화 실패 시 원본 또는 빈 문자열 표시 (데이터 오류 문구 제거)
        String rawEmail = user.getEmail();
        String rawPhone = user.getPhone();
        if (rawEmail == null) rawEmail = "";
        if (rawPhone == null) rawPhone = "";
        if ("S99".equals(user.getStatusCode())) {
            dto.setEmail(rawEmail);
            dto.setPhone(rawPhone);
        } else {
            try {
                dto.setEmail(rawEmail.isEmpty() ? "" : aes256Util.decrypt(rawEmail));
                dto.setPhone(rawPhone.isEmpty() ? "" : aes256Util.decrypt(rawPhone));
            } catch (Exception e) {
                // 복호화 실패 시(암호화 안 된 데이터 등) 원본 그대로 표시
                dto.setEmail(rawEmail);
                dto.setPhone(rawPhone);
            }
        }



        return dto;
    }

    /** 내가 적은 리뷰 삭제 (작성자 본인만 가능) */
    @org.springframework.transaction.annotation.Transactional
    public void deleteMyReview(Long userNo, Long reviewNo) {
        Review review = reviewRepository.findById(reviewNo)
                .orElseThrow(() -> new RuntimeException("해당 리뷰를 찾을 수 없습니다."));
        if (!review.getWriterNo().equals(userNo)) {
            throw new RuntimeException("본인이 작성한 리뷰만 삭제할 수 있습니다.");
        }
        reviewRepository.delete(review);
    }

    @org.springframework.transaction.annotation.Transactional
    public Long saveCalendarEvent(Long userNo, GeneralMyPageDTO.CalendarEventDTO dto) {

        // 프론트에서 넘어온 데이터와 임시 기본값을 조합해 Entity를 조립합니다.
        CalendarEvent event = CalendarEvent.builder()
                .userNo(userNo)
                .title(dto.getTitle())
                .startDate(dto.getStart())
                .colorCode(dto.getBackgroundColor())
                .roomId(null)
                .lawyerNo(null)
                .build();

        // 조립된 Entity를 DB에 저장합니다.
        CalendarEvent savedEvent = calendarEventRepository.save(event);

        // 저장 직후 DB에서 자동 생성된 eventNo를 꺼내서 컨트롤러로 돌려줍니다.
        return savedEvent.getEventNo();
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateCalendarEvent(Long eventNo, Long userNo, GeneralMyPageDTO.CalendarEventDTO dto) {
        CalendarEvent event = calendarEventRepository.findById(eventNo)
                .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));

        // ★ 내 일정이 맞는지 팩트 체크
        if (!event.getUserNo().equals(userNo)) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }
        event.setTitle(dto.getTitle());
        event.setColorCode(dto.getBackgroundColor());
        event.setStartDate(dto.getStart());
        // JPA의 더티 체킹(Dirty Checking) 덕분에 별도로 save()를 안 해도 DB에 반영됨
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteCalendarEvent(Long eventNo, Long userNo) {

        CalendarEvent event = calendarEventRepository.findById(eventNo)
                .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));

        if (!event.getUserNo().equals(userNo)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        calendarEventRepository.deleteById(eventNo);
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateProfileData(Long userNo, String newName, String newEmail, String newPhone, org.springframework.web.multipart.MultipartFile profileImage) throws Exception {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        // 1. 닉네임 변경
        if (newName != null && !newName.trim().isEmpty()) {
            user.setNickNm(newName);
        }

        // 2. 이메일 변경 (중복 검사 + 해시 교체) — 평문만 set: @Convert(Aes256Converter)가 DB 저장 시 한 번만 암호화
        if (newEmail != null && !newEmail.trim().isEmpty()) {
            String trimmed = newEmail.trim();
            String newEmailHash = hashUtil.generateHash(trimmed);
            // 내 기존 해시값이랑 다른데, DB에 이미 존재하면 남이 쓰고 있는 거임
            if (!newEmailHash.equals(user.getEmailHash()) && userRepository.existsByEmailHash(newEmailHash)) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
            }

            user.setEmail(trimmed);
            user.setEmailHash(newEmailHash);
        }

        // 3. 전화번호 변경 (중복 검사 + 해시 교체)
        if (newPhone != null && !newPhone.trim().isEmpty()) {
            String trimmedPhone = newPhone.trim();
            String newPhoneHash = hashUtil.generateHash(trimmedPhone);
            if (!newPhoneHash.equals(user.getPhoneHash()) && userRepository.existsByPhoneHash(newPhoneHash)) {
                throw new IllegalArgumentException("이미 사용 중인 전화번호입니다.");
            }
            user.setPhone(trimmedPhone);
            user.setPhoneHash(newPhoneHash);
        }

        // 4. 프로필 이미지 저장 로직 (너네 FileController 쪽에 있는 저장 로직 활용해라)
        // 4. 프로필 이미지 저장 로직 (Z드라이브 연동 완료)
        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                java.io.File dir = new java.io.File(profileUploadDir);
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                // 파일명 중복되면 기존 이미지 날아가니까 UUID로 개명시킴
                String originalFilename = profileImage.getOriginalFilename();
                String extension = "";
                if(originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String savedFilename = java.util.UUID.randomUUID().toString() + extension;

                // Z드라이브에 물리적으로 쾅! 저장
                java.nio.file.Path filePath = java.nio.file.Paths.get(profileUploadDir + savedFilename);
                java.nio.file.Files.write(filePath, profileImage.getBytes());

                // DB에는 웹에서 볼 수 있는 '/images/profiles/어쩌고.jpg' 형태의 가상 URL을 저장
                String imageUrl = "/images/profiles/" + savedFilename;
                user.setProfileImg(imageUrl);

            } catch (Exception e) {
                e.printStackTrace();
                throw new RuntimeException("프로필 이미지 저장 중 오류가 났습니다..");
            }
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void updatePassword(Long userNo, String oldPw, String newPw) {
        User user = userRepository.findById(userNo).orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
        // 팩트 체크: 예전 비밀번호가 맞는지 검증
        if (!passwordEncoder.matches(oldPw, user.getUserPw())) {
            throw new RuntimeException("기존 비밀번호가 일치하지 않습니다.");
        }
        // 새 비밀번호 암호화해서 저장
        user.setUserPw(passwordEncoder.encode(newPw));
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteAccount(Long userNo) {
        // 실제 실무에서는 deleteById 대신 status를 '탈퇴'로 바꾸지만, 일단 진짜 삭제로 간다
        // userRepository.deleteById(userNo);

        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        user.setStatusCode("S99"); // JPA 더티 체킹으로 알아서 자동 UPDATE 됨

        String dummyEmail = "deleted_" +userNo+ UUID.randomUUID().toString().substring(0, 6)+"@law.com";
        String dummyPhone = "010-0000-" +userNo + UUID.randomUUID().toString().substring(0, 6) ;
        String dummyUserId = "deleted_" +userNo + UUID.randomUUID().toString().substring(0, 16);


        user.setNickNm("탈퇴한 사용자" + UUID.randomUUID().toString().substring(0, 6) );
        user.setUserId(dummyUserId);
        user.setEmail(user.getEmailHash());
        user.setPhone(user.getPhoneHash());
        user.setEmailHash(dummyEmail);
        user.setPhoneHash(dummyPhone);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteChatRoom(String roomId, Long userNo) {
        // 1. 해당 채팅방이 존재하는지 팩트 체크
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("해당 상담 내역을 찾을 수 없습니다."));

        // 2. 권한 검증: 의뢰인 또는 담당 변호사만 목록에서 숨김(ST99) 가능
        if (!room.getUserNo().equals(userNo) && !room.getLawyerNo().equals(userNo)) {
            throw new RuntimeException("삭제 권한이 없습니다. 해당 상담의 의뢰인 또는 담당 변호사만 숨길 수 있습니다.");
        }

        // 3. 목록에서만 숨김 (소프트 삭제: progressCode ST99)
        room.setProgressCode("ST99");
    }

    public User getUserById(Long userNo) {
        return userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("해당 유저를 찾을 수 없습니다."));
    }
}