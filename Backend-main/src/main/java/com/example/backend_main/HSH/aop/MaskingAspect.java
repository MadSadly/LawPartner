package com.example.backend_main.HSH.aop;

import com.example.backend_main.common.util.MaskingUtil;
import com.example.backend_main.common.annotation.Masking;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Collection;

@Aspect
@Component
@Slf4j
public class MaskingAspect {

    @AfterReturning(pointcut = "@annotation(com.example.backend_main.common.annotation.Masking)", returning = "result")
    public void applyMasking(JoinPoint joinPoint, Object result) {
        if (result == null) return;

        // SUPER_ADMIN / ADMIN은 마스킹 없이 평문 반환
        if (isPrivilegedAdmin()) return;

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Masking masking = signature.getMethod().getAnnotation(Masking.class);
        String[] targetFields = masking.fields();

        try {
            if (result instanceof Collection<?> collection) {
                for (Object item : collection) maskFields(item, targetFields);
            } else {
                maskFields(result, targetFields);
            }
        } catch (Exception e) {
            log.error("🚨 [마스킹 처리 실패] 메서드: {}, 사유: {}", signature.getName(), e.getMessage());
        }
    }

    /**
     * ROLE_SUPER_ADMIN 또는 ROLE_ADMIN이면 true (마스킹 스킵 대상)
     * SecurityContext가 없거나 인증 정보가 없으면 보수적으로 마스킹 적용 (false)
     */
    private boolean isPrivilegedAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return false;

        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority())
                            || "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private void maskFields(Object obj, String[] targetFields) {
        if (obj == null) return;
        Class<?> clazz = obj.getClass();

        for (String fieldName : targetFields) {
            try {
                Field field = clazz.getDeclaredField(fieldName);
                field.setAccessible(true);

                Object value = field.get(obj);
                if (value instanceof String strValue) {
                    String masked = "email".equals(fieldName)
                            ? MaskingUtil.maskEmail(strValue)
                            : doMaskPhone(strValue);
                    field.set(obj, masked);
                }
            } catch (Exception ignored) {
                // 해당 필드가 없는 객체는 안전하게 스킵
            }
        }
    }

    private String doMaskPhone(String phone) {
        if (phone == null || phone.length() < 4) return phone;
        return phone.substring(0, phone.length() - 4) + "****";
    }
}