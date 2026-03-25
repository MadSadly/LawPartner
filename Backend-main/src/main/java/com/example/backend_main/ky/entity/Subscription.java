package com.example.backend_main.ky.entity;

import com.example.backend_main.common.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/*
 [Subscription Entity]
 TB_SUBSCRIPTION 테이블과 매핑
 결제 검증 성공 후 구독 정보를 저장하는 테이블
*/
@Entity
@Table(name = "TB_SUBSCRIPTION")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SUB_NO")
    private Long subNo;

    // 어떤 유저의 구독인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_NO", nullable = false)
    private User user;

    // 포트원 주문번호 (중복 방지용 unique)
    @Column(name = "PAYMENT_ID", nullable = false, unique = true, length = 100)
    private String paymentId;

    // 실제 결제된 금액
    @Column(name = "AMOUNT", nullable = false)
    private Integer amount;

    // 구독 등록 시각
    @Column(name = "SUB_DT", nullable = false, updatable = false)
    private LocalDateTime subDt;

    @PrePersist
    public void prePersist() {
        this.subDt = LocalDateTime.now();
    }
}