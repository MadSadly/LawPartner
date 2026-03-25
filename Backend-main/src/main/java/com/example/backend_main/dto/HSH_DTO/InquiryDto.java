package com.example.backend_main.dto.HSH_DTO;

import com.example.backend_main.common.entity.CustomerInquiry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

public class InquiryDto {

    // ==================================================================================
    // 📥 요청 DTO (Request)
    // ==================================================================================

    /**
     * [문의 등록 요청] — 사용자가 문의 작성 시 사용
     */
    @Getter
    @Setter
    public static class CreateRequest {

        @NotBlank(message = "문의 유형은 필수 입력 항목입니다.")
        private String type;

        @NotBlank(message = "제목은 필수 입력 항목입니다.")
        @Size(max = 300, message = "제목은 300자 이내로 입력해주세요.")
        private String title;

        @NotBlank(message = "내용은 필수 입력 항목입니다.")
        private String content;
    }

    /**
     * [답변 저장 요청] — 관리자가 답변 작성 시 사용
     */
    @Getter
    @Setter
    public static class AnswerRequest {

        @NotBlank(message = "답변 내용은 필수 입력 항목입니다.")
        private String answerContent;

        private String answeredBy;  // 답변자 이름 (없으면 "관리자" 기본값)
    }

    // ==================================================================================
    // 📤 응답 DTO (Response)
    // ==================================================================================

    /**
     * [문의 목록 응답] — 목록 조회 시 사용 (CLOB 필드 제외해 응답 경량화)
     */
    @Getter
    @Builder
    public static class ListResponse {
        private Long id;
        private String type;
        private String title;
        private String status;
        private String writerNm; // ★ 추가: 작성자 이름 (목록에서도 누구 건지 알면 좋음)
        private String nickNm;
        private String answeredBy;
        private boolean hasAnswer;
        private LocalDateTime createdAt;
        private LocalDateTime answeredAt;

        public static ListResponse from(CustomerInquiry entity) {
            return ListResponse.builder()
                    .id(entity.getId())
                    .type(entity.getType())
                    .title(entity.getTitle())
                    .status(entity.getStatus())
                    // 만약 entity에 User 연관관계가 맺어져 있다면 entity.getWriter().getUserNm() 등으로 변경
                    .writerNm(entity.getWriterNm()) // ★ 추가: 엔티티에 해당 필드가 있다면 매핑
                    .nickNm(entity.getWriter() != null ? entity.getWriter().getNickNm() : null)
                    .answeredBy(entity.getAnsweredBy())
                    .hasAnswer(entity.getAnswerContent() != null)
                    .createdAt(entity.getCreatedAt())
                    .answeredAt(entity.getAnsweredAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class DetailResponse {
        private Long id;
        private Long writerNo;
        private String userId;   // ★ 추가: 작성자 아이디 (화면 표시용 @userId)
        private String writerNm; // ★ 추가: 작성자 실명
        private String nickNm;
        private String type;
        private String title;
        private String content;
        private String status;
        private String answerContent;
        private String answeredBy;
        private LocalDateTime answeredAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static DetailResponse from(CustomerInquiry entity) {
            return DetailResponse.builder()
                    .id(entity.getId())
                    // 객체에서 번호 추출 + findById()로 조회할 경우엔 LAZY 로딩이라 NPE가 날 수 있어 방어처리..
                    .writerNo(entity.getWriter() != null ? entity.getWriter().getUserNo() : null)
                    .userId(entity.getUserId())               // 엔티티에 만든 편의 메서드 사용
                    .writerNm(entity.getWriterNm())           // 엔티티에 만든 편의 메서드 사용
                    .nickNm(entity.getWriter() != null ? entity.getWriter().getNickNm() : null)
                    .type(entity.getType())
                    .title(entity.getTitle())
                    .content(entity.getContent())
                    .status(entity.getStatus())
                    .answerContent(entity.getAnswerContent())
                    .answeredBy(entity.getAnsweredBy())
                    .answeredAt(entity.getAnsweredAt())
                    .createdAt(entity.getCreatedAt())
                    .updatedAt(entity.getUpdatedAt())
                    .build();
        }
    }

}