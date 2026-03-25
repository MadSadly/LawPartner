package com.example.backend_main.HSH.aop;

import com.example.backend_main.common.annotation.ActionLog;
import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.AdminAudit;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.repository.AdminAuditRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.util.IpUtil;
import org.slf4j.MDC;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LogingAspect {

    private final AccessLogRepository accessLogRepository;
    private final UserRepository userRepository;
    private final AdminAuditRepository adminAuditRepository;

    // ==================================================================================
    // 1. 📢 [기본 접속 로그] 모든 컨트롤러 요청 시 작동
    // ==================================================================================

    @Around("execution(* com.example.backend_main..*Controller.*(..))")
    public Object logAccess(ProceedingJoinPoint joinPoint) throws Throwable {

        // 1. 요청 고유 식별자 생성 및 MDC 등록
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("TRACE_ID", traceId);
        long startTime = System.currentTimeMillis();

        // 2. 기본값 설정 — 변수 선언 시 미리 초기화하여 NPE 방지
        String ip = "Unknown";
        String uri = "Unknown";
        String userAgent = "Unknown";
        HttpServletResponse httpResponse = null;

        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            // [A] 일반 HTTP (REST API) 요청
            HttpServletRequest request = ((ServletRequestAttributes) attributes).getRequest();
            httpResponse = ((ServletRequestAttributes) attributes).getResponse();

            ip = IpUtil.getClientIp(request); // ✅ 공통 유틸로 교체
            uri = request.getRequestURI();
            userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 200) {
                userAgent = userAgent.substring(0, 200);
            }
        } else {
            // [B] WebSocket (STOMP 채팅 등) 통신
            String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
            String methodName = joinPoint.getSignature().getName();
            uri = "[STOMP] /" + className + "/" + methodName;
            ip = "WebSocket Client";
            userAgent = "WebSocket Session";
        }

        Long userNo = getCurrentUserNo();

        Object result = null; // ✅ 초기화
        String errorMsg = null;

        try {
            result = joinPoint.proceed();
        } catch (Exception e) {
            errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.length() > 500) {
                errorMsg = errorMsg.substring(0, 500);
            }
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // ✅ GlobalExceptionHandler가 예외를 처리한 후의 실제 상태코드를 읽어옴
            int status = 200;
            if (httpResponse != null) {
                status = httpResponse.getStatus();
            }

            log.info("📢 [Audit] TraceID: {}, URI: {}, Status: {}, Time: {}ms", traceId, uri, status, duration);

            try {
                accessLogRepository.save(AccessLog.builder()
                        .traceId(traceId)
                        .reqIp(ip)
                        .reqUri(uri)
                        .userAgent(userAgent)
                        .userNo(userNo)
                        .statusCode(status)
                        .execTime(duration)
                        .errorMsg(errorMsg)
                        .regDt(LocalDateTime.now())
                        .build());
            } catch (Exception e) {
                log.error("🚨 [접속 로그 저장 실패] {}", e.getMessage());
            }

            MDC.clear();
        }

        return result;
    }

    // ==================================================================================
    // 2. 👀 [커스텀 행위 로그] @ActionLog가 붙은 메서드만 작동
    // ==================================================================================

    @Around("@annotation(com.example.backend_main.common.annotation.ActionLog)")
    public Object logAdminAction(ProceedingJoinPoint joinPoint) throws Throwable {

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        ActionLog actionLog = signature.getMethod().getAnnotation(ActionLog.class);

        String actionType = actionLog.action();
        String targetInfo = actionLog.target();

        // 1. 관리자 정보
        Long adminNo = getCurrentUserNo();
        String adminId = "UNKNOWN";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            adminId = auth.getName();
        }

        // 2. 요청 환경 정보
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        String ip = "Unknown IP";
        String userAgent = "Unknown Agent";

        if (attributes != null) {
            HttpServletRequest request = ((ServletRequestAttributes) attributes).getRequest();
            ip = IpUtil.getClientIp(request); // ✅ 공통 유틸로 교체
            userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 200) userAgent = userAgent.substring(0, 200);
        }

        String traceId = MDC.get("TRACE_ID");
        if (traceId == null) traceId = "SYSTEM";

        // 3. reason 추출 — Map, @RequestParam, DTO 필드까지 모두 커버
        String reason = "사유 미입력";
        Object[] args = joinPoint.getArgs();
        String[] parameterNames = signature.getParameterNames();

        for (int i = 0; i < args.length; i++) {
            Object arg = args[i];
            if (arg == null) continue;

            // 케이스 A: @RequestBody Map<String, String>
            if (arg instanceof java.util.Map<?, ?> mapArg) {
                if (mapArg.containsKey("reason") && mapArg.get("reason") != null) {
                    reason = String.valueOf(mapArg.get("reason"));
                    break;
                }
            }
            // 케이스 B: @RequestParam String reason
            else if (parameterNames != null && "reason".equals(parameterNames[i])) {
                reason = String.valueOf(arg);
                break;
            }
            // 케이스 C: DTO 안에 reason 필드가 있을 때 (리플렉션으로 꺼내기)
            else {
                try {
                    var field = arg.getClass().getDeclaredField("reason");
                    field.setAccessible(true);
                    Object val = field.get(arg);
                    if (val != null) {
                        reason = String.valueOf(val);
                        break;
                    }
                } catch (NoSuchFieldException ignored) {
                    // reason 필드가 없는 DTO는 그냥 넘어감
                }
            }
        }

        // 4. adminNo 검증 — try 진입 전에 처리
        if (adminNo == null) {
            log.error("🚨 [보안 경고] @ActionLog 메서드에 미인증 접근 감지! TraceID: {}, Action: {}", traceId, actionType);
            throw new IllegalStateException("감사 로그 저장 실패: 인증된 관리자 정보가 없습니다.");
        }

        log.info("👀 [Admin Action Start] Admin: {}({}), Action: {}, Target: {}, Reason: {}",
                adminId, adminNo, actionType, targetInfo, reason);

        Object result = null; // ✅ 초기화
        String errorYn = "N";
        String errorMsg = null;

        try {
            result = joinPoint.proceed();
            log.info("✅ [Admin Action Success] Admin: {}, Action: {}, TraceID: {}", adminId, actionType, traceId);
        } catch (Exception e) {
            errorYn = "Y";
            errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.length() > 500) errorMsg = errorMsg.substring(0, 500);
            log.error("❌ [Admin Action Fail] Admin: {}, Action: {}, Error: {}", adminId, actionType, e.getMessage());
            throw e;
        } finally {
            try {
                adminAuditRepository.save(AdminAudit.builder()
                        .adminNo(adminNo)
                        .adminId(adminId)
                        .actionType(actionType)
                        .targetInfo(targetInfo)
                        .reason(reason)
                        .traceId(traceId)
                        .errorYn(errorYn)
                        .errorMsg(errorMsg)
                        .reqIp(ip)
                        .userAgent(userAgent)
                        .build());
            } catch (Exception e) {
                log.error("🚨 [감사 로그 저장 실패] {}", e.getMessage());
            }
        }

        return result;
    }

    // ==================================================================================
    // 🔧 헬퍼 메서드
    // ==================================================================================

    /*
     SecurityContext에서 현재 로그인한 유저의 PK(USER_NO)를 가져오는 메서드
     3단계 폴백: JWT details → CustomUserDetails → DB 조회 (최후의 보루)
    */
    private Long getCurrentUserNo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }

        try {
            // 1단계: JWT details에서 꺼내기 (DB 조회 없음 — 가장 빠름)
            Object details = auth.getDetails();
            if (details instanceof java.util.Map<?, ?> mapDetails) {
                if (mapDetails.containsKey("userNo") && mapDetails.get("userNo") != null) {
                    return ((Number) mapDetails.get("userNo")).longValue();
                }
            }

            // 2단계: Principal이 CustomUserDetails인 경우
            Object principal = auth.getPrincipal();
            if (principal instanceof CustomUserDetails customDetails) {
                return customDetails.getUserNo();
            }

            // 3단계: 최후의 보루 — DB 조회 (폼 로그인 등 예외 케이스)
            return userRepository.findByEmail(auth.getName())
                    .map(User::getUserNo)
                    .orElse(null);

        } catch (Exception e) {
            log.warn("⚠️ [사용자 번호 조회 실패] {}", e.getMessage());
            return null;
        }
    }

    // ✅ getClientIp() 메서드 삭제 — IpUtil.getClientIp()로 완전 대체
}