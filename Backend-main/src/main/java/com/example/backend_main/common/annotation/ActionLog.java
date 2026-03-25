package com.example.backend_main.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD) // 메소드 위에 붙여서 쓴다
// 서버가 실행되는 동안에도 해당 표식을 읽을 수 있게 설정
@Retention(RetentionPolicy.RUNTIME)
public @interface ActionLog {
    String action(); // 행위 (예: "LAWYER_APPROVE", "EXCEL_DOWNLOAD")
    String target() default "-"; // 대상 (예: "USER_NO", "TB_ACCESS_LOG")
}