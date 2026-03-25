package com.example.backend_main.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

public class CustomerInquiryDTO {

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

        private String answeredBy;
    }
}