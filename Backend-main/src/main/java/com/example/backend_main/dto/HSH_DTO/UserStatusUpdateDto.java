package com.example.backend_main.dto.HSH_DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserStatusUpdateDto {

    @NotBlank(message = "상태를 변경할 대상 회원의 아이디가 누락되었습니다.")
    private String userId;

    @NotBlank(message = "변경할 상태 코드가 누락되었습니다.")
    @Pattern(regexp = "^S[0-9]{2}$", message = "상태 코드가 올바르지 않습니다. (예: S01, S02)")
    private String statusCode;

    @NotBlank(message = "감사 로그를 위한 변경 사유 입력은 필수입니다.")
    @Size(min = 5, message = "사유는 최소 5자 이상 입력해야 합니다.")
    private String reason;
}