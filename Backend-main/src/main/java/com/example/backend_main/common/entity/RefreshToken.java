package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_REFRESH_TOKEN")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TOKEN_ID")
    private Long tokenId;

    @Column(name = "USER_NO", nullable = false, unique = true) // ★ unique 설정으로 1인 1토큰(중복 로그인 방지)
    private Long userNo;

    @Column(name = "TOKEN_VALUE", nullable = false, length = 64)
    private String tokenValue;

    @Column(name = "EXPIRE_DT", nullable = false)
    private LocalDateTime expireDt;

    // 새로운 토큰으로 업데이트하는 메서드 (중복 로그인 방지의 핵심)
    public void updateToken(String newToken, LocalDateTime newExpireDt) {
        this.tokenValue = newToken;
        this.expireDt = newExpireDt;
    }
}