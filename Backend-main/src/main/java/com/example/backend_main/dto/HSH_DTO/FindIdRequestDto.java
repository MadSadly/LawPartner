package com.example.backend_main.dto.HSH_DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FindIdRequestDto {

    @NotBlank(message = "이름을 입력해주세요.")
    private String userNm;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;
}

