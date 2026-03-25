package com.example.backend_main.ky.service;

import com.example.backend_main.ky.dto.SubscriptionInfoDTO;
import com.example.backend_main.ky.entity.Subscription;
import com.example.backend_main.ky.repository.SubscriptionRepository;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    // application-secret.properties 에 portone.secret.key=시크릿키 추가 필요
    @Value("${portone.secret.key}")
    private String portoneSecretKey;

    // 실제 결제되어야 하는 금액 (20,000원 - 10,000원 할인 = 10,000원)
    private static final int EXPECTED_AMOUNT = 10000;

    @Transactional
    public void verifyAndSave(String paymentId, Long userNo) {

        // 1. 중복 결제 처리 방지
        if (subscriptionRepository.existsByPaymentId(paymentId)) {
            throw new IllegalStateException("이미 처리된 결제입니다.");
        }

        // 2. 포트원 서버에 직접 결제 정보 조회
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "PortOne " + portoneSecretKey);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.portone.io/payments/" + paymentId,
                HttpMethod.GET,
                request,
                Map.class
        );

        Map<?, ?> body = response.getBody();
        if (body == null) {
            throw new IllegalStateException("포트원 서버 응답이 없습니다.");
        }

        // 3. 결제 상태 확인 (PAID 여야만 정상)
        String status = (String) body.get("status");
        if (!"PAID".equals(status)) {
            throw new IllegalStateException("결제 상태 이상: " + status);
        }

        // 4. 실제 결제 금액 검증 (핵심 보안 체크)
        Map<?, ?> amountMap = (Map<?, ?>) body.get("amount");
        int paidAmount = ((Number) amountMap.get("total")).intValue();
        if (paidAmount != EXPECTED_AMOUNT) {
            throw new IllegalStateException("결제 금액 불일치 - 예상: " + EXPECTED_AMOUNT + ", 실제: " + paidAmount);
        }

        // 5. 검증 통과 → DB에 구독 저장
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalStateException("유저 정보를 찾을 수 없습니다."));

        subscriptionRepository.save(Subscription.builder()
                .user(user)
                .paymentId(paymentId)
                .amount(paidAmount)
                .build());
    }

    // 구독 상태 및 결제 내역 조회
    public SubscriptionInfoDTO getSubscriptionInfo(Long userNo) {
        boolean subscribed = subscriptionRepository.existsByUser_UserNo(userNo);

        List<Subscription> subs = subscriptionRepository.findByUser_UserNoOrderBySubDtDesc(userNo);

        String nextPaymentDate = null;
        if (subscribed && !subs.isEmpty()) {
            nextPaymentDate = subs.get(0).getSubDt()
                    .plusMonths(1)
                    .format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일"));
        }

        List<SubscriptionInfoDTO.PaymentHistoryItem> history = subs.stream()
                .map(s -> SubscriptionInfoDTO.PaymentHistoryItem.builder()
                        .date(s.getSubDt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                        .amount(s.getAmount())
                        .build())
                .collect(Collectors.toList());

        return SubscriptionInfoDTO.builder()
                .subscribed(subscribed)
                .nextPaymentDate(nextPaymentDate)
                .history(history)
                .build();
    }

    // 구독 취소
    @Transactional
    public void cancelSubscription(Long userNo) {
        subscriptionRepository.deleteByUser_UserNo(userNo);
    }
}