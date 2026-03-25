package com.example.backend_main.ky.dto;

import lombok.Data;

/*
 [LawyerDashboardDTO]
 변호사 대시보드 API 응답/요청 DTO 모음
*/
@Data
public class LawyerDashboardDTO {

    // ── 후기 응답 ──────────────────────────────
    @Data
    public static class ReviewDTO {
        private Long   reviewNo;
        private String writerNm;  // TB_USER 에서 JOIN
        private Double  stars;  // NUMBER(2,1) → 소수점 지원
        private String content;
        private String regDate;   // yyyy-MM-dd
        private Long   boardNo;  // 연결된 게시글 번호 (클릭 시 이동용)
    }

    // ── 상담(채팅방) 응답 ──────────────────────
    @Data
    public static class ConsultationDTO {
        private String roomId;       // UUID
        private String clientNm;     // TB_USER 에서 JOIN
        private String progressCode; // ST01~ST05
        private String statusLabel;  // 한글 변환
        private String regDate;      // yyyy-MM-dd
        private long   unreadCount;  // 미읽음 메시지 수 (뱃지 표시용)
    }

    // ── 통계 응답 ──────────────────────────────
    @Data
    public static class StatsDTO {
        private long   solvedCount;   // ST05 (사건 종료) 건수
        private long   requestCount;  // 전체 상담 건수
        private double avgRating;     // 평균 별점
    }

    // ── 일정 응답 ──────────────────────────────
    @Data
    public static class CalendarDTO {
        private Long   eventNo;
        private String title;
        private String startDate; // yyyy-MM-dd
        private String colorCode;
    }

    // ── 일정 추가 요청 ──────────────────────────
    @Data
    public static class CalendarRequest {
        private String title;
        private String startDate;
        private String colorCode;
    }
}
