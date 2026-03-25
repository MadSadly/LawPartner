package com.example.backend_main.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/*
아이디 찾기 / 비밀번호 찾기를 너무 많이 요청하면 막아주는 메서드!

ex) 해커가 프로그램 1초에 1000번 비밀번호 찾기를 시도하면 서버가 죽거나, 개인정보가 털릴 수 있습니다.
이를 막기 위해 1분에 최대 N번만 허용하는 제한을 걸어둡니다.
->  Rate Limiter


Bucket4j : 토큰 버킷
양동이에 토큰(물)이 담겨있다고 생각하면, 요청 1번 = 토큰 1개 소비합니다.
토큰이 다 떨어지면 차단. 1분마다 토큰이 자동으로 다시 채워지는 원리입니다.

ConcurrentHashMap : 여러 사람이 동시에 접근해도 안전한 저장소
일반 HashMap은 동시에 여러 요청이 오면 데이터가 꼬일 수 있음

인메모리 방식 : 서버의 RAM(메모리)에 저장하는 방식, 빠르지만 서버가 꺼지면 사라짐 (휘발성)

단일 인스턴스/Scale-out : 서버가 1대면 단일 인스턴스, 사용자가 많아지면 서버를 2대, 3대로 늘리는 것이 Scale-out입니다.

Scale-out 시 문제 : 
1. 서버가 3대면 각 서버가 각자의 양동이를 들고 있음
2. 해커가 서버 A에 10번, 서버 B에 10번, 서버 Cdp 10번 요청하면 총 30번이 통과. 즉, 제한이 무의미해짐

Redis : 모든 서버가 공유하는 외부저장소.
양동이를 각 서버가 들고 잇는 것이 아니라, 공용 창고에 두는 것으로 어느 서버로 요청이 와도 같은 양동이를 씀

*/
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountRecoveryRateLimiter {

    private final SecurityMonitorService securityMonitorService;

    private static final int MAX_IP_REQUESTS_PER_MINUTE = 10;
    private static final int MAX_EMAIL_REQUESTS_PER_MINUTE = 3;
    private static final int MAX_IDENTIFIER_REQUESTS_PER_MINUTE = 5;
    
    /*
    IP만 막으면 VPN으로 IP 바꿔 우회 가능.
    이메일만 막으면 다른 이메일로 우회 가능.
    둘 다 막아야 (ipAllowed && emailAllowed) 차단 가능.
    이것이 return ipAllowed && emailAllowed; 한 줄 설계의 이유
    */

    // IP별 버킷 저장소
    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    // EMAIL별 버킷 저장소
    private final Map<String, Bucket> emailBuckets = new ConcurrentHashMap<>();
    // USER_ID별 버킷 저장소
    private final Map<String, Bucket> identifierBuckets = new ConcurrentHashMap<>();
    private final Map<String, Instant> bucketCreatedAt = new ConcurrentHashMap<>();

    private Bucket createIpBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_IP_REQUESTS_PER_MINUTE)
                        .refillGreedy(MAX_IP_REQUESTS_PER_MINUTE,
                                Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private Bucket createEmailBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_EMAIL_REQUESTS_PER_MINUTE)
                        .refillGreedy(MAX_EMAIL_REQUESTS_PER_MINUTE,
                                Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private Bucket createIdentifierBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_IDENTIFIER_REQUESTS_PER_MINUTE)
                        .refillGreedy(MAX_IDENTIFIER_REQUESTS_PER_MINUTE,
                                Duration.ofMinutes(1))
                        .build())
                .build();
    }

    public boolean isAllowed(String clientIp, String targetEmail) {
        Bucket ipBucket = ipBuckets.computeIfAbsent(clientIp, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createIpBucket();
        });
        Bucket emailBucket = emailBuckets.computeIfAbsent(targetEmail, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createEmailBucket();
        });

        boolean ipAllowed = ipBucket.tryConsume(1);
        boolean emailAllowed = emailBucket.tryConsume(1);

        if (!ipAllowed) {
            log.warn("[RateLimit] IP 차단: {}", clientIp);
            securityMonitorService.trackAndAlert(
                    clientIp, "IP_RATE_LIMIT_EXCEEDED");
        }
        if (!emailAllowed) {
            log.warn("[RateLimit] EMAIL 차단: {}", targetEmail);
            securityMonitorService.trackAndAlert(
                    clientIp, "EMAIL_RATE_LIMIT_EXCEEDED");
        }

        return ipAllowed && emailAllowed;
    }

    public boolean isAllowedLogin(String clientIp, String userId) {
        Bucket ipBucket = ipBuckets.computeIfAbsent(clientIp, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createIpBucket();
        });
        Bucket identifierBucket = identifierBuckets.computeIfAbsent(userId, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createIdentifierBucket();
        });

        boolean ipAllowed = ipBucket.tryConsume(1);
        boolean identifierAllowed = identifierBucket.tryConsume(1);

        if (!ipAllowed) {
            log.warn("[RateLimit] 로그인 IP 차단: {}", clientIp);
            securityMonitorService.trackAndAlert(clientIp, "LOGIN_IP_RATE_LIMIT_EXCEEDED");
        }
        if (!identifierAllowed) {
            log.warn("[RateLimit] 로그인 UserId 차단: {}", userId);
            securityMonitorService.trackAndAlert(clientIp, "LOGIN_ID_RATE_LIMIT_EXCEEDED");
        }

        return ipAllowed && identifierAllowed;
    }

    @Scheduled(fixedRate = 300_000)
    public void cleanUpExpiredBuckets() {
        Instant threshold = Instant.now().minusSeconds(300);

        ipBuckets.entrySet().removeIf(e ->
                bucketCreatedAt.getOrDefault(e.getKey(), Instant.EPOCH).isBefore(threshold));
        emailBuckets.entrySet().removeIf(e ->
                bucketCreatedAt.getOrDefault(e.getKey(), Instant.EPOCH).isBefore(threshold));
        identifierBuckets.entrySet().removeIf(e ->
                bucketCreatedAt.getOrDefault(e.getKey(), Instant.EPOCH).isBefore(threshold));
        bucketCreatedAt.entrySet().removeIf(e ->
                e.getValue().isBefore(threshold));

        log.info("[RateLimit] 만료 버킷 정리 완료");
    }
}

