package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_IP_BLACKLIST")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BlacklistIp {

    @Id // IP 자체를 기본키(PK)로 사용!
    @Column(name = "IP_ADDR", length = 50)
    private String ipAddress;

    @Column(name = "REASON", nullable = false, length = 200)
    private String reason;

    @Column(name = "ADMIN_NO", nullable = false)
    private Long adminNo; // 누가 차단했는지 기록

    @Column(name = "BLOCK_DT")
    private LocalDateTime blockDt; // 생성일시
}