package com.example.backend_main.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BoardBlindDto {

    @NotNull(message = "게시글 번호는 필수 항목입니다.")
    private Long boardNo;

    @NotBlank(message = "블라인드 처리 사유를 반드시 입력해야 합니다.")
    private String reason;
}