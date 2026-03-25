package com.example.backend_main.common.util;

import jakarta.servlet.http.HttpServletRequest;

/*
 [IpUtil]
 클라이언트 IP 추출 공통 유틸
 - GlobalExceptionHandler, LogingAspect 양쪽에서 동일하게 사용
 - 중복 제거 목적
*/
public class IpUtil {

    private IpUtil() {}

    /**
     * 로그/분석용 IP 추출 (프록시 헤더 포함)
     * X-Forwarded-For를 신뢰하여 실제 클라이언트 IP를 추적한다.
     * 단, 보안 판단(Rate Limiting 등)에는 사용하지 말 것.
     */
    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("Proxy-Client-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getRemoteAddr();

        // 다중 프록시 환경: 첫 번째 IP가 진짜 클라이언트 IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return normalizeIp(ip);
    }

    /**
     * Rate Limiter 전용 IP 추출 (TCP 연결 IP만 사용)
     * X-Forwarded-For 헤더를 무시하여 헤더 위조 공격을 원천 차단한다.
     * NAT 환경에서는 공유기 IP가 반환되며, 이는 네트워크 단위 제어로 허용된 동작이다.
     */
    public static String getRateLimitIp(HttpServletRequest request) {
        return normalizeIp(request.getRemoteAddr());
    }

    private static String normalizeIp(String ip) {
        if (ip == null) return null;

        // IPv6 로컬 → IPv4 변환
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }

        // ::ffff:192.168.x.x → 192.168.x.x 변환
        if (ip.startsWith("::ffff:")) {
            return ip.substring(7);
        }

        return ip;
    }
}