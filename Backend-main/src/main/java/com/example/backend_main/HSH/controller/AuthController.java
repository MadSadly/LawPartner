package com.example.backend_main.HSH.controller;

import com.example.backend_main.dto.HSH_DTO.ChangePasswordRequestDto;
import com.example.backend_main.HSH.service.AuthService;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.security.AccountRecoveryRateLimiter;
import com.example.backend_main.common.util.IpUtil;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.HSH_DTO.LoginRequestDto;
import com.example.backend_main.dto.HSH_DTO.TokenDTO;
import com.example.backend_main.dto.HSH_DTO.UserJoinRequestDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
// 쿠키 설정을 위한 스프링 유틸리티
import org.springframework.http.ResponseCookie;
// 헤더 이름을 상수로 쓰기 위한 스프링 유틸리티 (중타 방지)
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.example.backend_main.common.security.CustomUserDetails;

/*
 [AuthController]
 회원가입 및 로그인을 담당하는 컨트롤러!!!
 모든 응답은 ResultVO 표준 식판에 담겨 전송 처리 !!!

@RestController : 단순히 글자를 보여주는 것이 아닌, 데이터를 주고 받는 전문 창구!
@RequestMapping("/api/auth") : 인증(Auth)전용 구역임을 알려주는 표지판..! 모든 요청 주소는 /api/auth로 시작
@RequiredArgsConstructor : AuthService라는 강력한 조력자를 생성자 주입 방식으로 데려오기!
*/
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AccountRecoveryRateLimiter rateLimiter;

    /*
        [회원 가입 API] - USR-01
        @Valid : DTO에 적힌 유효성 검사(NotBlank, Email 등)를 실행합니다.
                 여기서 통과하지 못하면 중앙 통제실(GlobalExceptionHandler)가 즉각 개입하여 차단..!
        UserJoinRequestDTO : 사용자가 보낸 DTO
    */
    @PostMapping("/join")
    public ResultVO<Void> join(@Valid @ModelAttribute UserJoinRequestDto dto){
        // AuthService : 데이터를 넘기는 곳, BCrypt와 AES-256 처리의 보안 작업..
        // "SUCCESS" 코드와 상세 메시지를 담아 반환
        authService.join(dto);
        return ResultVO.ok("JOIN-SUCCESS","회원가입이 성공적으로 완료되었습니다!",null);
    }

    /*
        [로그인 API]
        성공시 리액트에게 JWT 토큰을 전달하기..!
        요구사항 AUTH-01과 SEC-01
        1. 아이디 비밀번호 확인 : 리액트가 보낸 Map 데이터에서 아이디/비번을 꺼내 AuthService에게 확인
        2. 정보 일치시 JwtTokenProvider가 만든 신분증(JWT)를 TokenDTO라는 디지털 신분증으로 주기
        3. 발급된 신분증 안에는 사용자의 권한(ROLE_USER/ROLE_LAWYER/ROLE_ADMIN)인지 알 수 있음.
            - 페이지 접근 분기 처리..

    */
    // ✅ AuthController.java의 login 메서드 수정 예시
    @PostMapping("/login")
    public ResultVO<TokenDTO> login(
            @Valid @RequestBody LoginRequestDto loginRequestDto,
            HttpServletRequest request,
            HttpServletResponse response) { // 응답 객체 추가

        String clientIp = IpUtil.getRateLimitIp(request);
        if (!rateLimiter.isAllowedLogin(clientIp, loginRequestDto.getUserId())) {
            throw new CustomException(ErrorCode.RATE_LIMIT_EXCEEDED, "잠시 후 다시 시도해주세요.");
        }

        TokenDTO tokenDTO = authService.login(loginRequestDto.getUserId(), loginRequestDto.getUserPw());

        // 🍪 Refresh Token을 위한 보안 쿠키 생성
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", tokenDTO.getRefreshToken())
                .httpOnly(true)    // JS 접근 차단 (보안 핵심)
                .secure(false)     // 현재 HTTP 개발 환경에서 쿠키 전송 허용
                .path("/")         // 모든 경로에서 사용
                .maxAge(7 * 24 * 60 * 60) // 7일 유지
                .sameSite("Lax")   // CSRF 방어
                .build();

        response.setHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

        // 보안을 위해 프론트로 전달되는 JSON 데이터에서는 refreshToken을 삭제합니다.
        tokenDTO.setRefreshToken(null);

        return ResultVO.ok("로그인 성공", tokenDTO);
    }

    @GetMapping("/check-id")
    public ResultVO<Boolean> checkId(@RequestParam("userId") String userId) {
        boolean isAvailable = authService.isUserIdAvailable(userId);

        return isAvailable
                ? ResultVO.ok("ID-AVAILABLE", "사용 가능한 아이디입니다.", true)
                : ResultVO.fail("ID-DUPLICATE", "이미 사용 중인 아이디입니다.");
    }

    @GetMapping("/check-email")
    public ResultVO<Boolean> checkEmail(@RequestParam("email") String email) {
        // HashUtil을 사용해 해시값으로 변환 후 DB 조회 (AuthService의 로직 활용 추천)
        // 컨트롤러는 "검사해줘"라고 서비스에게 시키기만 합니다.
        // 암호화를 해서 찾든, 그냥 찾든 컨트롤러는 몰라도 됩니다. (캡슐화)
        boolean isAvailable = authService.isEmailAvailable(email);

        return isAvailable
                ? ResultVO.ok("EMAIL-AVAILABLE", "사용 가능한 이메일입니다.", true)
                : ResultVO.fail("EMAIL-DUPLICATE", "이미 가입된 이메일입니다.");
    }

    @GetMapping("/check-phone")
    public ResultVO<Boolean> checkPhone(@RequestParam("phone") String phone) {
        // 1. 입력받은 전화번호(010-XXXX-XXXX)를 해시로 변환

        boolean isAvailable = authService.isPhoneAvailable(phone);

        return isAvailable
                ? ResultVO.ok("PHONE-AVAILABLE", "사용 가능한 번호입니다.", true)
                : ResultVO.fail("PHONE-DUPLICATE", "이미 가입된 번호입니다.");
    }

    // @RequestBody Map<String, String> payload
    // 프론트에서 보낸 JSON 데이터{refreshToken:"...")를 자바의 Map 형태로 가져오겠습니당! 
    // 즉, Key : Value형태
    @PostMapping("/refresh")
    public ResultVO<TokenDTO> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        // 1. 서비스 호출 (이제 파라미터로 DTO가 아닌 request 자체를 넘깁니다)
        TokenDTO newTokenDTO = authService.refresh(request);

        // 2. 새로 발급받은 리프레시 토큰을 다시 보안 쿠키로 굽기
        ResponseCookie cookie = ResponseCookie.from("refreshToken", newTokenDTO.getRefreshToken())
                .httpOnly(true)
                .secure(false) // 현재 HTTP 개발 환경에서 쿠키 전송 허용
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        // 3. 헤더에 쿠키 세팅
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 4. 보안을 위해 JSON 본문에서는 제거하고 전송
        newTokenDTO.setRefreshToken(null);
        return ResultVO.ok("토큰 재발급 성공", newTokenDTO);
    }

    @PutMapping("/change-password")
    public ResultVO<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequestDto dto
    ) {
        if (userDetails == null || userDetails.getUserNo() == null) {
            return ResultVO.fail("AUTH-401", "로그인이 필요합니다.");
        }
        authService.changePassword(userDetails.getUserNo(), dto.getNewPassword());
        return ResultVO.ok("비밀번호가 성공적으로 변경되었습니다.", null);
    }

    @DeleteMapping("/logout")
    public ResultVO<?> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {
        authService.logout(refreshToken, response);
        return ResultVO.ok("로그아웃 되었습니다.", null);
    }

}
