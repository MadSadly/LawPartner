package com.example.backend_main.common.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityMonitorService {

    // 스레드 안전성(Thread-safe)을 보장하는 메모리 저장소 (IP별 에러 카운트)
    private final Map<String, AtomicInteger> errorCountMap = new ConcurrentHashMap<>();

    // 슬랙(Slack) 웹훅 URL (나중에 파트너님의 슬랙 채널에서 발급받아 넣으시면 됩니다)
    @Value("${slack.webhook.url:}")
    private String slackWebhookUrl;

    private final RestTemplate restTemplate = new RestTemplate(); // HTTP 요청용

    /*
     [도입 원인] 해커나 봇(Bot)이 짧은 시간에 악의적인 요청을 쏟아부을 때 이를 감지하기 위함
     [기대 결과] 특정 IP가 1분 안에 50회 이상 에러를 유발하면 즉시 슬랙 알림 발송
    */
    public void trackAndAlert(String clientIp, String errorType) {
        if (clientIp == null || clientIp.isEmpty()) return;

        // 1. 해당 IP의 에러 카운트 1 증가
        errorCountMap.putIfAbsent(clientIp, new AtomicInteger(0));
        int currentCount = errorCountMap.get(clientIp).incrementAndGet();

        // 2. 임계치(예: 50회) 도달 시 슬랙 알림 쏘기!
        if (currentCount == 50) {
            log.error("🚨 [SECURITY ALERT] IP: {} 에서 비정상적인 요청 폭주 감지! (유형: {})", clientIp, errorType);
            sendSlackAlert(clientIp, errorType);
        }
    }

    /*
     매 1분마다 카운트를 0으로 초기화 (스케줄러)
     이 코드가 작동하려면 메인 애플리케이션 클래스에 @EnableScheduling 이 붙어있어야 합니다.
    */
    @Scheduled(fixedRate = 60000) // 60초마다 실행
    public void resetCounts() {
        errorCountMap.clear();
    }

    /*
     슬랙으로 실제 알림을 전송하는 메서드
     [개선] @Async를 붙여서, 알림 보내느라 원래 요청이 느려지는 것을 방지 (별도 스레드에서 실행)
    */
    @Async
    protected void sendSlackAlert(String ip, String errorType) {
        if (slackWebhookUrl == null || slackWebhookUrl.isEmpty()) {
            log.warn("슬랙 웹훅 URL이 설정되지 않아 알림을 보낼 수 없습니다. (IP: {})", ip);
            return;
        }

        try {
            // 슬랙에 보낼 메시지 양식
            String message = String.format("🚨 *[긴급 보안 알림]* 🚨\n- *발생 IP:* %s\n- *에러 유형:* %s\n- *내용:* 1분 내 50회 이상 비정상 요청 감지. DDoS 공격 또는 매크로 봇이 의심됩니다. 서버 로그를 확인하세요!", ip, errorType);
            Map<String, String> payload = Map.of("text", message);

            // 헤더에 에러코드·출처 추가 (관리자/모니터링에서 필터링·라우팅 시 활용)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Source", "BATCH");           // 배치/스케줄러 발신 구분
            headers.set("X-Error-Code", errorType != null ? errorType : "UNKNOWN");
            headers.set("X-Alert-IP", ip != null ? ip : "");
            headers.set("X-Service", "LAWPARTNER-SECURITY");

            HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(slackWebhookUrl, request, String.class);
        } catch (Exception e) {
            log.error("슬랙 알림 전송 실패: {}", e.getMessage());
        }
    }
}
