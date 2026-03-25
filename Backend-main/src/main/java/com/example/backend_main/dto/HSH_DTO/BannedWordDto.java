package com.example.backend_main.dto.HSH_DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BannedWordDto {

    @NotBlank(message = "등록할 금지어를 입력해주세요.")
    private String word;

    @NotBlank(message = "등록 사유를 입력해주세요.")
    private String reason;
}