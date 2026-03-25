package com.example.backend_main.dto.HSH_DTO;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TokenDTO {
    // "Bearer"라는 인증 방식 명시
    private String grantType;
    // 실제 문을 열 때 쓰는 단거리 통행증
    private String accessToken;
    // Access Token이 만료되면 교환할 때 쓰는 장기 통행증
    private String refreshToken;
    private String userNm;
    private String role;
    private String nickNm;
    // 이메일 처리..
    private Long userNo;
    // ★ 추가: 이메일과 유저 번호 필드
    private String email;
    // 임시 비밀번호 사용 여부 플래그 (Y/N 또는 boolean으로 해석)
    private boolean passwordChangeRequired;
}
