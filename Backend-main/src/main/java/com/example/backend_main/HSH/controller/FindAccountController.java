package com.example.backend_main.HSH.controller;

import com.example.backend_main.HSH.service.FindAccountService;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.security.AccountRecoveryRateLimiter;
import com.example.backend_main.common.util.IpUtil;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.HSH_DTO.FindIdRequestDto;
import com.example.backend_main.dto.HSH_DTO.FindPasswordRequestDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class FindAccountController {

    private final FindAccountService findAccountService;
    private final AccountRecoveryRateLimiter rateLimiter;

    @PostMapping("/find-id")
    public ResultVO<String> findId(
            @Valid @RequestBody FindIdRequestDto dto,
            HttpServletRequest request
    ) {
        String clientIp = IpUtil.getRateLimitIp(request);
        if (!rateLimiter.isAllowed(clientIp, dto.getEmail())) {
            throw new CustomException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }

        String maskedUserId = findAccountService.sendUserIdByEmail(dto);
        return ResultVO.ok("아이디 찾기 요청이 정상적으로 처리되었습니다. 등록된 이메일을 확인해주세요.", maskedUserId);
    }

    @PostMapping("/find-password")
    public ResultVO<Void> findPassword(
            @Valid @RequestBody FindPasswordRequestDto dto,
            HttpServletRequest request
    ) {
        String clientIp = IpUtil.getRateLimitIp(request);
        if (!rateLimiter.isAllowed(clientIp, dto.getEmail())) {
            throw new CustomException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }

        findAccountService.resetPasswordAndSendTempPassword(dto);
        return ResultVO.ok("임시 비밀번호를 등록된 이메일로 전송했습니다. 로그인 후 비밀번호를 변경해주세요.", null);
    }
}

