package com.example.backend_main.dto.HSH_DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRoleUpdateDto {
    @NotBlank(message = "권한을 변경할 대상 회원의 아이디가 누락되었습니다.")
    private String userId;

    @NotBlank(message = "변경할 권한 코드가 누락되었습니다.")
    private String roleCode;

    @NotBlank(message = "감사 로그를 위한 변경 사유 입력은 필수입니다.")
    private String reason;
}