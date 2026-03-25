package com.example.backend_main.ky.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class SubscriptionInfoDTO {

    private boolean subscribed;
    private String nextPaymentDate; // 다음 결제 예정일 (구독 중일 때만)
    private List<PaymentHistoryItem> history;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class PaymentHistoryItem {
        private String date;
        private int amount;
    }
}
