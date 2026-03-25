package com.example.backend_main.common.exception;

import com.example.backend_main.common.security.SecurityMonitorService;
import com.example.backend_main.common.util.IpUtil;
import com.example.backend_main.common.vo.ResultVO;
import jakarta.validation.ConstraintViolationException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.NoSuchElementException;

/*
 사고를 처리하는 [중앙 통제실]
 - 신고서를 보고 병원에 보낼지, 경찰을 보낼지 결정
 - 🔴 보안 위협 에러(405, 404, 403) → SecurityMonitorService에 추적 보고
 - 🔵 일반 비즈니스 에러 → 추적 없이 응답만 반환
 - IP 추출: IpUtil.getClientIp() 공통 유틸 사용 (LogingAspect와 중복 제거)
*/
@RestControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final SecurityMonitorService securityMonitorService;

    // ==================================================================================
    // 1. 🧮 [비즈니스 로직 에러] 개발자가 의도적으로 던지는 에러들
    // ==================================================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResultVO<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("⚠️ [Invalid Input] 사용자 입력 오류: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.INVALID_INPUT, e.getMessage()));
    }

    @ExceptionHandler({NoSuchElementException.class, EntityNotFoundException.class})
    public ResponseEntity<ResultVO<Void>> handleNotFoundException(Exception e) {
        log.warn("⚠️ [Not Found] 데이터를 찾을 수 없음: {}", e.getMessage());
        String message = e.getMessage() != null ? e.getMessage() : ErrorCode.DATA_NOT_FOUND.getMessage();
        return ResponseEntity
                .status(ErrorCode.DATA_NOT_FOUND.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.DATA_NOT_FOUND, message));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ResultVO<Void>> handleIllegalStateException(IllegalStateException e) {
        log.warn("⚠️ [Illegal State] 잘못된 상태 요청: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.ILLEGAL_STATE.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.ILLEGAL_STATE, e.getMessage()));
    }

    // ==================================================================================
    // 2. 📝 [스프링 웹 / 파라미터 / JSON 바인딩 에러] 프론트엔드의 실수들
    // ==================================================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResultVO<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        log.warn("⚠️ [Validation Error] 양식 검증 실패: {}", errorMessage);
        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.VALIDATION_ERROR, errorMessage));
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ResultVO<Void>> handleBindException(BindException e) {
        String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        log.warn("⚠️ [Validation Error] 바인딩 검증 실패: {}", errorMessage);
        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.VALIDATION_ERROR, errorMessage));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ResultVO<Void>> handleConstraintViolationException(ConstraintViolationException e) {
        String errorMessage = e.getMessage() != null ? e.getMessage() : ErrorCode.INVALID_INPUT.getMessage();
        log.warn("⚠️ [Constraint Violation] 제약 조건 위반: {}", errorMessage);
        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.INVALID_INPUT, errorMessage));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ResultVO<Void>> handleTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.warn("⚠️ [Type Mismatch] 잘못된 타입 전달: 파라미터 '{}'에 '{}' 값이 들어왔습니다.", e.getName(), e.getValue());
        return ResponseEntity
                .status(ErrorCode.TYPE_MISMATCH.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.TYPE_MISMATCH));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ResultVO<Void>> handleMissingParamException(MissingServletRequestParameterException e) {
        log.warn("⚠️ [Missing Parameter] 필수 파라미터 누락: {}", e.getParameterName());
        return ResponseEntity
                .status(ErrorCode.MISSING_PARAM.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.MISSING_PARAM));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ResultVO<Void>> handleMissingHeaderException(MissingRequestHeaderException e) {
        log.warn("⚠️ [Missing Header] 필수 헤더 누락: {}", e.getHeaderName());
        return ResponseEntity
                .status(ErrorCode.MISSING_HEADER.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.MISSING_HEADER));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResultVO<Void>> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        log.warn("⚠️ [JSON Parse Error] 프론트엔드 JSON 파싱 실패: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.JSON_PARSE_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.JSON_PARSE_ERROR));
    }

    // ✅ [보안 추적] 봇/스캐너가 가장 많이 유발하는 에러 — IP 추출 후 관제 서비스에 보고
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ResultVO<Void>> handleMethodNotSupportedException(
            HttpRequestMethodNotSupportedException e,
            HttpServletRequest request) {
        String clientIp = IpUtil.getClientIp(request);
        log.warn("⚠️ [Method Not Supported] 잘못된 HTTP 메서드 호출: {} (IP: {})", e.getMethod(), clientIp);
        securityMonitorService.trackAndAlert(clientIp, "Method Not Supported (405)");
        return ResponseEntity
                .status(ErrorCode.METHOD_NOT_ALLOWED.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.METHOD_NOT_ALLOWED));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ResultVO<Void>> handleMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException e) {
        log.warn("⚠️ [Media Type Error] 지원하지 않는 미디어 타입: {}", e.getContentType());
        return ResponseEntity
                .status(ErrorCode.UNSUPPORTED_MEDIA_TYPE.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.UNSUPPORTED_MEDIA_TYPE));
    }

    // ✅ [보안 추적] 존재하지 않는 API 스캐닝 시도 — IP 추출 후 관제 서비스에 보고
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ResultVO<Void>> handleNoHandlerFoundException(
            NoHandlerFoundException e,
            HttpServletRequest request) {
        String clientIp = IpUtil.getClientIp(request);
        log.warn("⚠️ [API Not Found] 존재하지 않는 API 요청: {} (IP: {})", e.getRequestURL(), clientIp);
        securityMonitorService.trackAndAlert(clientIp, "API Not Found (404)");
        return ResponseEntity
                .status(ErrorCode.API_NOT_FOUND.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.API_NOT_FOUND));
    }

    // ==================================================================================
    // 3. 🗄️ [데이터베이스 & 파일 에러]
    // ==================================================================================

    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<ResultVO<Void>> handleDuplicateKeyException(DuplicateKeyException e) {
        log.warn("⚠️ [Duplicate Key] 데이터 중복 발생: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.DUPLICATE_DATA.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.DUPLICATE_DATA));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResultVO<Void>> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        log.error("🚨 [DB Constraint Violation] 데이터베이스 제약 조건 위배: ", e);
        return ResponseEntity
                .status(ErrorCode.DB_CONSTRAINT_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.DB_CONSTRAINT_ERROR));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResultVO<Void>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
        log.warn("⚠️ [File Size Exceeded] 파일 업로드 용량 초과");
        return ResponseEntity
                .status(ErrorCode.FILE_TOO_LARGE.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.FILE_TOO_LARGE));
    }

    // ==================================================================================
    // 4. 🔒 [스프링 시큐리티 관련 에러]
    // ==================================================================================

    // ✅ [보안 추적] 권한 없는 접근 시도 — IP 추출 후 관제 서비스에 보고
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResultVO<Void>> handleAccessDeniedException(
            AccessDeniedException e,
            HttpServletRequest request) {
        String clientIp = IpUtil.getClientIp(request);
        log.warn("⚠️ [Access Denied] 권한이 없는 사용자의 접근 시도 (IP: {})", clientIp);
        securityMonitorService.trackAndAlert(clientIp, "Access Denied (403)");
        return ResponseEntity
                .status(ErrorCode.ACCESS_DENIED.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.ACCESS_DENIED));
    }

    // ==================================================================================
    // 5. 💣 [최후의 보루] 위에서 못 잡은 모든 에러 (500)
    // ==================================================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResultVO<Void>> handleAllException(Exception e) {
        log.error("🚨 [Critical System Error] 원인 미상의 서버 에러 발생: ", e);
        return ResponseEntity
                .status(ErrorCode.SYSTEM_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.SYSTEM_ERROR)); // 500은 절대 내부 메시지 노출 금지
    }

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ResultVO<Void>> handleCustomException(CustomException e) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn("⚠️ [Business Error] 코드: {}, 메시지: {}", errorCode.getCode(), e.getMessage());
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ResultVO.fail(errorCode, e.getMessage()));
    }
}