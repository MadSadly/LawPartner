package com.example.backend_main.common.exception;

import lombok.Getter;

/*
 * [CustomException]
 * - 비즈니스 로직 중 발생하는 모든 예외를 담당합니다.
 * - ErrorCode를 필드로 가져가서 GlobalExceptionHandler가 어떤 응답을 줄지 결정하게 합니다.
 */
@Getter
public class CustomException extends RuntimeException {
    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public CustomException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}