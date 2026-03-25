package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.entity.Notification;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.repository.NotificationRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.GeneralMyPageDTO;
import com.example.backend_main.dto.ProfileUpdateDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://192.168.0.43:3000", "http://localhost:3000"})
public class GeneralMyPageController {

    private final GeneralMyPageService myPageService;
    private final JwtTokenProvider jwtTokenProvider; // ★ 신분증 해독기 추가
    private final ChatRoomRepository chatRoomRepository;
    private final NotificationRepository notificationRepository;


    @GetMapping("/general")
    // ★ 리턴 타입을 팀 표준인 ResultVO로 변경
    public ResultVO<GeneralMyPageDTO> getGeneralDashboard(
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) {
            return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");
        }
        GeneralMyPageDTO data = myPageService.getDashboardData(userNo);

        // 4. ResultVO 표준 식판에 담아서 반환
        return ResultVO.ok("마이페이지 조회 성공", data);
    }

    @PostMapping("/calendar")
    public ResultVO<Long> addCalendarEvents(
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody GeneralMyPageDTO.CalendarEventDTO dto
    ){
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");

        // 2. Service 클래스의 메서드를 호출하여 userNo와 dto를 넘겨준다
        // DB에 저장된 진짜 일정 번호(eventNo)를 리턴받습니다.
        Long savedEventNo = myPageService.saveCalendarEvent(userNo, dto);

        // 3. 프론트엔드에게 성공 메시지와 함께 방금 생성된 일정 번호를 줍니다.
        return ResultVO.ok("일정 추가 성공",savedEventNo);

    }

    @PutMapping("/calendar/{eventNo}")
    public ResultVO<String> updateCalendarEvent(
            @PathVariable("eventNo") Long eventNo,
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody GeneralMyPageDTO.CalendarEventDTO dto
    ){
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");

        myPageService.updateCalendarEvent(eventNo, userNo, dto);
        return ResultVO.ok("일정 수정 성공", null);
    }

    @DeleteMapping("/calendar/{eventNo}")
    public ResultVO<String> deleteCalendarEvent(
            @PathVariable("eventNo") Long eventNo,
            @RequestHeader(value = "Authorization", required = false) String token
    ){
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");

        myPageService.deleteCalendarEvent(eventNo, userNo);
        return ResultVO.ok("일정 삭제 성공", null);
    }

    // 1. 프로필 이름 수정
    @PostMapping(value = "/profile/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResultVO<String> updateProfile(
            @ModelAttribute ProfileUpdateDTO dto,
            @RequestHeader(value = "Authorization", required = false) String token // ★ 헤더에서 직접 토큰 받기!
    ) throws Exception {

        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) {
            throw new RuntimeException("로그인이 필요한 서비스입니다.");
        }

        // 3. 서비스 호출 (내가 직접 찾은 userNo 넘겨줌)
        myPageService.updateProfileData(
                userNo,
                dto.getName(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getProfileImage()
        );

        return ResultVO.ok("프로필 수정 성공", null);
    }


    // 2. 비밀번호 수정
    @PutMapping("/password")
    public ResultVO<String> updatePassword(
            @RequestHeader(value = "Authorization" , required = false) String token,
            @RequestBody java.util.Map<String, String> body) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");
        myPageService.updatePassword(userNo, body.get("oldPassword"), body.get("newPassword"));
        return ResultVO.ok("비밀번호 수정 성공", null);
    }

    // 3. 회원 탈퇴
    @DeleteMapping("/account")
    public ResultVO<String> deleteAccount(
            @RequestHeader(value = "Authorization", required = false) String token) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");
        myPageService.deleteAccount(userNo);
        return ResultVO.ok("회원 탈퇴 성공", null);
    }

    // ==============================================================
    // 1. 알림 개수 세기 (수정)
    // ==============================================================
    @GetMapping("/notifications/count")
    public ResponseEntity<?> getUnreadNotificationCount(
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(0);
        }
        try {

            // ★ 과거의 쓰레기 로직(ChatRoom 상태로 세기) 버리고 진짜 Notification DB에서 센다!
            int count = (int) notificationRepository.countByUserNoAndReadYn(userNo, "N");
            return ResponseEntity.ok(count);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(0);
        }
    }

    // ==============================================================
    // 2. 알림 읽음 처리 API (신규 추가)
    // ==============================================================
    @PutMapping("/notifications/read")
    public ResponseEntity<?> markNotificationsAsRead(
            @RequestHeader(value = "Authorization", required = false) String token) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            // DB에 있는 내 알림을 전부 'Y'로 바꾼다.
            notificationRepository.markAllAsRead(userNo);
            return ResponseEntity.ok("처리 완료");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/notifications/list")
    public ResponseEntity<?> getNotificationList(
            @RequestHeader(value = "Authorization", required = false) String token) {

        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {

            // ★ [핵심] 아까 수정한 레포지토리 메서드 사용 (안 읽은 알림 'N'만 가져오기)
            List<Notification> notis = notificationRepository.findTop10ByUserNoOrderByRegDtDesc(userNo);

            List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            for(Notification n : notis) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", n.getAlarmNo());
                map.put("title", n.getMsgTitle()); // ★ 보낸 사람 이름
                map.put("text", n.getMsgContent()); // 채팅 내용
                map.put("roomId", n.getRoomId()); // ★ 이동할 방 번호
                map.put("time", n.getRegDt() != null ? n.getRegDt().format(formatter) : "방금 전");
                map.put("read", "Y".equals(n.getReadYn()));
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @DeleteMapping("/review/{reviewNo}")
    public ResultVO<String> deleteMyReview(
            @PathVariable("reviewNo") Long reviewNo,
            @RequestHeader(value = "Authorization", required = false) String token) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");
        myPageService.deleteMyReview(userNo, reviewNo);
        return ResultVO.ok("리뷰가 삭제되었습니다.", null);
    }

    @DeleteMapping("/chat/room/{roomId}")
    public ResultVO<String> deleteConsultation(
            @PathVariable("roomId") String roomId,
            // ★ 여기도 토큰 직접 받기
            @RequestHeader(value = "Authorization", required = false) String token) {

        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) {
            throw new RuntimeException("로그인이 필요한 서비스입니다. (토큰 없음)");
        }

        // 3. 서비스 호출
        myPageService.deleteChatRoom(roomId, userNo);
        return ResultVO.ok("상담이 삭제되었습니다.", null);
    }



}