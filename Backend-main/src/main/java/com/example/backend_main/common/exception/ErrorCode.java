package com.example.backend_main.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
/*
code : 비즈니스 식별 코드
용도 : 프론트엔드 개발자가 로직 분기 처리하기 위한 기계용 ID
이유 : HTTP 상태 코드(400, 401 등)만으로는 상세한 이유 알 수 없음, 동일한 400 에러라도,
    아이디 중복 / 비밀번호 형식 오류 등등 해당 오류에 따라 프론트에서 띄워줘야 할 화면이나 기능이 다름.

message : 기본 안내 문구
용도 : 사용자에게 보여줄 기본적인 설명
이유 : 프론트에서 에러메시지를 하드코딩하지 않아도, 서버가 보내준는 메시지를 그대로 toast.error(message)처럼 출력

**** JSON_PARSE_ERROR 같은 코드는 어디로 가는가? ****
발송지 : 프론트엔드의 Axios 인터셉터나 컴포넌트

1단계 : 프론트 엔드에서 JSON 형식이 깨진 데이터를 보냄
2단계 : 서버의 GlobalExceptionHandler가 이를 낚아채, ErrorCode.JSON_PARSE_ERROR를 꺼냄
3단계 : ResultVO에 담겨 아래와 같은 모양의 JSON 데이터로 변호나
{
  "success": false,
  "code": "JSON_PARSE_ERROR",
  "message": "요청 데이터 형식이 잘못되었습니다.",
  "data": null
}
4단계 : 해당 JSON 데이터가 네트워크를 타고 프론트로 이동
5단계 : axiosConfig.js 혹은 catch 문에서 데이터를 받기
예시: LoginPage.js의 catch 블록
} catch (error) {
    // 여기서 error.response.data를 열어보면
    // 서버가 보낸 "JSON_PARSE_ERROR" 코드를 확인할 수 있습니다.
    const serverError = error.response.data;
    console.log(serverError.code); // "JSON_PARSE_ERROR" 출력
    toast.error(serverError.message); // "요청 데이터 형식이 잘못되었습니다." 출력
}
*/
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 1. 비즈니스 로직 에러
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "잘못된 입력값입니다."),
    DATA_NOT_FOUND(HttpStatus.NOT_FOUND, "DATA_NOT_FOUND", "요청하신 데이터를 찾을 수 없습니다."),
    ILLEGAL_STATE(HttpStatus.CONFLICT, "ILLEGAL_STATE", "잘못된 상태 요청입니다."),

    // 2. 인증 및 가입 관련
    DUPLICATE_USER_ID(HttpStatus.BAD_REQUEST, "AUTH-001", "이미 사용 중인 아이디입니다."),
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "AUTH-002", "이미 가입된 이메일입니다."),
    DUPLICATE_PHONE(HttpStatus.BAD_REQUEST, "AUTH-003", "이미 가입된 휴대폰 번호입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "AUTH-004", "비밀번호 형식이 올바르지 않습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "AUTH-005", "존재하지 않는 회원입니다."),

    // 3. 스프링 웹 / 파라미터 / JSON 바인딩 에러
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "입력값 검증에 실패했습니다."),
    TYPE_MISMATCH(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH", "잘못된 형식의 데이터가 전달되었습니다."),
    MISSING_PARAM(HttpStatus.BAD_REQUEST, "MISSING_PARAM", "필수 파라미터가 누락되었습니다."),
    MISSING_HEADER(HttpStatus.BAD_REQUEST, "MISSING_HEADER", "필수 헤더값이 누락되었습니다."),
    JSON_PARSE_ERROR(HttpStatus.BAD_REQUEST, "JSON_PARSE_ERROR", "요청 데이터 형식이 잘못되었습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "지원하지 않는 호출 방식입니다."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "지원하지 않는 데이터 형식입니다."),
    API_NOT_FOUND(HttpStatus.NOT_FOUND, "API_NOT_FOUND", "요청하신 API 주소를 찾을 수 없습니다."),

    // 4. 데이터베이스 & 파일 에러
    DUPLICATE_DATA(HttpStatus.CONFLICT, "DUPLICATE_DATA", "이미 존재하는 데이터입니다."),
    DB_CONSTRAINT_ERROR(HttpStatus.CONFLICT, "DB_CONSTRAINT_ERROR", "데이터베이스 제약 조건 위배 오류입니다."),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "업로드 가능한 파일 용량을 초과했습니다."),
    FILE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_UPLOAD_ERROR", "파일 업로드 중 오류가 발생했습니다."),

    // 5. 보안
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "해당 기능을 실행할 권한이 없습니다."),
    ENCRYPTION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS-001", "데이터 암호화 중 오류가 발생했습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-401", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH-402", "만료된 토큰입니다."),
    RATE_LIMIT_EXCEEDED(HttpStatus.FORBIDDEN, "SEC-429", "요청이 너무 자주 발생했습니다. 잠시 후 다시 시도해주세요."),

    // 6. 서버 에러
    SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYSTEM_ERROR", "서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
