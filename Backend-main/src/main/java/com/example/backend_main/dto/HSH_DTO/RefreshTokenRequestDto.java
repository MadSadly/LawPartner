package com.example.backend_main.dto.HSH_DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefreshTokenRequestDto {
    @NotBlank(message = "리프레시 토큰이 누락되었습니다.")
    private String refreshToken;
}