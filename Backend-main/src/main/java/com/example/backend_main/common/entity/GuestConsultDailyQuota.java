package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "TB_AI_GUEST_CONSULT_QUOTA",
        uniqueConstraints = @UniqueConstraint(name = "UK_GUEST_AI_QUOTA", columnNames = {"CLIENT_IP", "QUOTA_DATE"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestConsultDailyQuota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CLIENT_IP", length = 64, nullable = false)
    private String clientIp;

    @Column(name = "QUOTA_DATE", nullable = false)
    private LocalDate quotaDate;

    @Column(name = "CALL_CNT", nullable = false)
    @Builder.Default
    private int callCnt = 0;
}
