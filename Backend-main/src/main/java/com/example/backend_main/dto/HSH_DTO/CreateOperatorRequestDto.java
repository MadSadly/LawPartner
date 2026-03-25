package com.example.backend_main.dto.HSH_DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOperatorRequestDto {

    @NotBlank(message = "아이디는 필수 입력 항목입니다.")
    private String userId;

    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    private String userNm;

    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "전화번호는 필수 입력 항목입니다.")
    @Pattern(regexp = "^010-\\d{3,4}-\\d{4}$", message = "올바른 전화번호 형식이 아닙니다. (010-0000-0000)")
    private String phone;

    @NotBlank(message = "생성 사유는 필수 입력 항목입니다.")
    private String reason;
}

