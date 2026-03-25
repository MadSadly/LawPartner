package com.example.backend_main.common.security;

import com.example.backend_main.common.entity.BlacklistIp;
import com.example.backend_main.common.repository.BlacklistIpRepository;
import com.example.backend_main.common.util.IpUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class IpBlacklistFilter extends OncePerRequestFilter {

    private final BlacklistIpRepository blacklistIpRepository;

    // 🌟 S급 최적화: DB 부하를 막기 위한 스레드 세이프 메모리 캐시
    private final Set<String> blacklistCache = ConcurrentHashMap.newKeySet();
    private long lastCacheUpdateTime = 0;
    private static final long CACHE_TTL_MS = 60000; // 캐시 갱신 주기 (1분)

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // 1. 요청 IP 추출
        String ip = IpUtil.getClientIp(request);

        // 2. 캐시 갱신 (1분이 지났다면 DB에서 새로 긁어와 메모리에 덮어쓰기)
        refreshCacheIfNecessary();

        // 3. 🚨 DB가 아닌 메모리(Cache)에서 즉시 검사! (I/O 병목 제로)
        if (ip != null && blacklistCache.contains(ip)) {
            log.warn("🚨 [차단된 IP 접근 방어] IP: {}, URI: {}", ip, request.getRequestURI());

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\": false, \"code\": \"BL-403\", \"message\": \"접근이 원천 차단된 IP입니다.\"}");
            return;
        }

        // 4. 통과
        filterChain.doFilter(request, response);
    }

    // 💡 주기적으로 DB와 동기화하는 로직 (동시성 방어 적용)
    private void refreshCacheIfNecessary() {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastCacheUpdateTime > CACHE_TTL_MS) {
            synchronized (this) {
                // synchronized 내부에서 한 번 더 체크 (더블 체킹 락)
                if (currentTime - lastCacheUpdateTime > CACHE_TTL_MS) {
                    try {
                        // DB에서 전체 차단 목록 조회
                        Set<String> latestBlacklist = blacklistIpRepository.findAll()
                                .stream()
                                .map(BlacklistIp::getIpAddress)
                                .collect(Collectors.toSet());

                        // 캐시 갈아끼우기
                        blacklistCache.clear();
                        blacklistCache.addAll(latestBlacklist);
                        lastCacheUpdateTime = System.currentTimeMillis();

                        // 로그가 너무 많이 찍히는 것을 방지하려면 log.debug 로 변경하셔도 좋습니다.
                        // log.info("🔄 [IP 블랙리스트 캐시 동기화 완료] 현재 차단된 IP 수: {}", blacklistCache.size());
                    } catch (Exception e) {
                        log.error("❌ 블랙리스트 캐시 갱신 중 오류 발생", e);
                    }
                }
            }
        }
    }

    // ✅ getClientIp() 삭제 — IpUtil.getClientIp()로 완전 대체
}