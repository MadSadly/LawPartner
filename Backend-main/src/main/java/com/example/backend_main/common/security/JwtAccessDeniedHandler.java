package com.example.backend_main.common.security;

import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.vo.ResultVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/*
[JwtAccessDeniedHandler]
로그인(인증)은 되었으나, 해당 메뉴에 대한 권한이 없을 때 호출됩니다.
예: '의뢰인'이 '변호사 전용 심사 메뉴'에 접근할 때
*/
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        // 1. 응답 설정 (JSON / UTF-8)
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // 2. HTTP 상태 코드 403 Forbidden 설정
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        // 3. 표준 식판(ResultVO)에 AUTH-403 코드와 메시지 담기
        // 로그인은 되어있으나, 권한이 없기에 메인페이지로 돌려보내거나, 접근 불가 알림 처리..
        ResultVO<Void> result = ResultVO.fail(ErrorCode.ACCESS_DENIED);

        // 4. JSON으로 변환하여 리액트에게 전송
        String jsonResponse = objectMapper.writeValueAsString(result);
        response.getWriter().write(jsonResponse);
    }
}