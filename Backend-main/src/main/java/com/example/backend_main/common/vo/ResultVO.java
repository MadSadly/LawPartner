package com.example.backend_main.common.vo;

import com.example.backend_main.common.exception.ErrorCode;
import lombok.Builder;
import lombok.Getter;

/*
# [ResultVO]
- 모든 API 응답을 담는 표준 식판
- 성공 여부, 메시지, 코드, 그리고 데이터(객체)를 하나로 묶어줍니다.

프론트에서는 다음과 같은 JSON을 받게 됨
{
  "success": false,
  "code": "AUTH-005",
  "message": "존재하지 않는 회원입니다.",
  "data": null
}
*/
@Getter
@Builder
public class ResultVO<T> {
    private boolean success;    // 성공 여부
    private String code;        // 비즈니스 로직 코드 (SUCCESS, AUTH-401, ERR-001 등)
    private String message;     // 응답 메시지
    private T data;             // 실제 데이터

    // ======================= [성공 응답 패턴] =======================

    // 1. [가장 많이 씀] 데이터만 보내면 성공으로 처리 (Code: SUCCESS)
    // 사용법: ResultVO.ok(userList);
    public static <T> ResultVO<T> ok(T data) {
        return ResultVO.<T>builder()
                .success(true)
                .code("SUCCESS") // 기본 성공 코드
                .message("성공적으로 처리되었습니다.")
                .data(data)
                .build();
    }

    // 2. [메시지 변경] 데이터와 함께 안내 문구를 바꾸고 싶을 때 (Code: SUCCESS)
    // 사용법: ResultVO.ok("회원가입 완료!", null);
    public static <T> ResultVO<T> ok(String message, T data) {
        return ResultVO.<T>builder()
                .success(true)
                .code("SUCCESS")
                .message(message)
                .data(data)
                .build();
    }

    // 3. [완전 커스텀] 코드까지 직접 지정하고 싶을 때 (특수 성공 케이스)
    // 사용법: ResultVO.ok("JOIN-SUCCESS", "환영합니다!", userDTO);
    public static <T> ResultVO<T> ok(String code, String message, T data) {
        return ResultVO.<T>builder()
                .success(true)
                .code(code)
                .message(message)
                .data(data)
                .build();
    }

    // ======================= [실패 응답 패턴] =======================

    // 4. [가장 많이 씀] 코드와 메시지만 보내서 실패 알리기
    // 사용법: ResultVO.fail("AUTH-401", "로그인이 필요합니다.");
    public static <T> ResultVO<T> fail(String code, String message) {
        return ResultVO.<T>builder()
                .success(false)
                .code(code)     // ★ 실패는 코드가 필수입니다!
                .message(message)
                .data(null)
                .build();
    }

    // 5. [상세 실패] 코드, 메시지, 그리고 '왜 틀렸는지' 상세 데이터까지 보낼 때
    // 사용법: 유효성 검사 실패 시 "어떤 필드가 틀렸는지" 리스트를 data에 담아 보냄
    public static <T> ResultVO<T> fail(String code, String message, T data) {
        return ResultVO.<T>builder()
                .success(false)
                .code(code)
                .message(message)
                .data(data)
                .build();
    }
    // ======================= [ErrorCode 연동] =======================

    // 6. [Enum 기본] ErrorCode의 기본 메시지 그대로 사용
    // 사용법: ResultVO.fail(ErrorCode.INVALID_INPUT);
    public static <T> ResultVO<T> fail(ErrorCode errorCode) {
        return ResultVO.<T>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .data(null)
                .build();
    }

    // 7. [Enum + 커스텀 메시지] 코드는 Enum, 메시지는 예외에서 꺼낼 때
    // 사용법: ResultVO.fail(ErrorCode.INVALID_INPUT, e.getMessage());
    public static <T> ResultVO<T> fail(ErrorCode errorCode, String customMessage) {
        return ResultVO.<T>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(customMessage)
                .data(null)
                .build();
    }


}