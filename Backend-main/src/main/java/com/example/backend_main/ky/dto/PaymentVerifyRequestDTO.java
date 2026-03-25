package com.example.backend_main.ky.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PaymentVerifyRequestDTO {
    private String paymentId; // 프론트에서 받는 포트원 주문번호
}