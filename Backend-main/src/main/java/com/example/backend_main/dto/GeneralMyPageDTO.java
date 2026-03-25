package com.example.backend_main.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;


import java.util.List;

@Getter @Setter @NoArgsConstructor
@Data
public class GeneralMyPageDTO {

    // 1. 사용자 정보
    private String userName;
    private String nickName;
    private String profileImage; // ★ 이거 추가

    // 2. 통계 (상단 카드)
    private int recentReplyCount;
    private int requestCount;
    private Integer daysLeft;

    private String email;
    private String phone;


    // 3. 최근 상담 요청 현황 (테이블)
    private List<ConsultationItemDTO> recentConsultations;

    // 4. 최근 내 게시글
    private List<MyBoardDTO> recentPosts;

    // 5. 캘린더 일정
    private List<CalendarEventDTO> calendarEvents;

    // 6. 내가 적은 리뷰 (변호사 상담 후 작성)
    private List<MyReviewDTO> myReviews;

    @Data
    public static class ConsultationItemDTO {
        private String roomId;
        private String lawyerName;     // 상담자(변호사) 이름
        private String category;       // 카테고리 (교통사고 등)
        private String status;         // 진행 상태
        private String regDate;        // 접수 날짜 (YYYY-MM-DD)
    }

    @Data
    public static class MyBoardDTO {
        private Long boardNo;
        private String title;
        private String regDate;
        private int replyCount;
    }

    @Data
    public static class CalendarEventDTO {
        private Long id; // 프론트에서 수정/삭제할 때 쓸 타겟 식별표. 무조건 추가
        @NotBlank(message = "일정 제목을 입력해주세요.")
        private String title;
        @NotBlank(message = "날짜를 입력해주세요.")
        private String start;  // YYYY-MM-DD
        @NotBlank(message = "색상을 입력해주세요.")
        private String backgroundColor; // 색상 코드
    }

    /** 내가 적은 리뷰 (변호사 상담 후 작성) */
    @Data
    public static class MyReviewDTO {
        private Long reviewNo;
        private Long lawyerNo;
        private String lawyerName;
        private Double stars;
        private String content;
        private String regDate;
    }

    // 프로필 조회 응답
    @Data
    public static class ProfileDTO {
        private String name;
        private String email;
        private String phone;
    }

    // 프로필 수정 요청
    @Data
    public static class ProfileUpdateDTO {
        private String name;
        private String email;
        private String phone;
    }

    // 비밀번호 변경 요청
    @Data
    public static class PasswordChangeDTO {
        @NotBlank(message = "현재 비밀번호를 입력해주세요.")
        private String currentPassword;
        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        private String newPassword;
    }

    // 회원탈퇴 요청
    @Data
    public static class WithdrawDTO {
        @NotBlank(message = "비밀번호를 입력해주세요.")
        private String password;
    }

}

