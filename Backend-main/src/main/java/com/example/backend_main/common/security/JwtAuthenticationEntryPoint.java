package com.example.backend_main.common.security;

import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.vo.ResultVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/*
[JwtAuthenticationEntryPoint]
인증되지 않은 사용자(명찰 없는 사람)가 보호된 자원에 접근했을 때 호출되는 클래스입니다.
401 Unauthorized 에러를 리액트가 이해할 수 있는 ResultVO 형식으로 응답합니다.
*/
// 1. 스프링이 관리하는 부품으로 등록!
// @Component : 해당 클래스는 보안 부품임을 스프링에게 알려주기
// AuthenticationEntryPoint : 스프링 시큐리티에서 인증 실패 시 처리는 자신이 맡는다는 약속된 인터페이스
//
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    // 2. JSON 변환기 (객체를 글자로 바꿔주는 도구)를 준비하기!
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 검거 시 실행되는 메서드!
    // HttpServletResponse response : 리엑트에게 돌려줄 응답 상자
    // AuthenticationException authException : 인증이 안 됐는지 이유(정보)가 담긴 바구니!
    // ex) 신분증이 없는지, 가짜인지 등등
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        // 3. 응답의 성격을 "나 지금 JSON 데이터 보낼 거야"라고 설정합니다.
        // setContentType : 리엑트가 응답 받을 때, HTML이 아닌 데이터(JSON)이라고 알려주기
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // 4. HTTP 상태 코드를 401(Unauthorized)로 설정합니다.
        // setStatus(SC_UNAUTHORIZED) : 401 에러를 명시적으로 보내주기
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // 5. 표준 객체(ResultVO)에 실패 메시지를 담습니다.
        // AUTH : 로그인 관련 - 누구세요?
        // 401 : HTTP 상태 코드 401에서 따온 숫자
        // AUTH-401 : 당신이 누구신지는 모르겠으니, 신분증(JWT토큰)을 가져오세요!
        ResultVO<Void> result = ResultVO.fail(ErrorCode.INVALID_TOKEN);;

        // 6. 식판(객체)을 문자열(JSON)로 바꿔서 손님(리액트)에게 전송합니다.
        // 자바 객체(ResultVO)를 이렉트가 읽을 수 있는 텍스트(JSON) 으로 변환하는 마법의 도구
        String jsonResponse = objectMapper.writeValueAsString(result);
        response.getWriter().write(jsonResponse);
    }
}