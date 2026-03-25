package com.example.backend_main.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD) // 컨트롤러 메서드에 붙일 예정
@Retention(RetentionPolicy.RUNTIME)
public @interface Masking {
    // 향후 확장성을 위해 마스킹할 필드명을 배열로 받을 수 있게 설계 (기본값 "phone")
    String[] fields() default {"phone"};
}