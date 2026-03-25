package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.RefreshToken;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.RefreshTokenRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.HSH_DTO.TokenDTO;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private HashUtil hashUtil;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_정상로그인_TokenDTO반환() {
        User user = User.builder()
                .userNo(1L)
                .userId("user1")
                .userPw("encodedPw")
                .userNm("홍길동")
                .nickNm("nick")
                .email("u@example.com")
                .emailHash("hash-email")
                .phone("010")
                .phoneHash("hash-phone")
                .statusCode("S01")
                .pwChangeRequired("N")
                .roleCode("ROLE_USER")
                .build();

        when(userRepository.findByUserId("user1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPw", "encodedPw")).thenReturn(true);

        TokenDTO issued = TokenDTO.builder()
                .grantType("Bearer")
                .accessToken("access")
                .refreshToken("refresh")
                .userNm("홍길동")
                .nickNm("nick")
                .userNo(1L)
                .passwordChangeRequired(false)
                .build();

        when(jwtTokenProvider.createToken(any(Authentication.class), eq(1L), eq("홍길동"), eq("nick")))
                .thenReturn(issued);

        TokenDTO result = authService.login("user1", "rawPw");

        assertThat(result).isNotNull();
        assertThat(result.isPasswordChangeRequired()).isFalse();
        verify(refreshTokenService).saveRefreshToken(1L, "refresh");
    }

    @Test
    void login_비밀번호변경강제_pwChangeRequired_true() {
        User user = User.builder()
                .userNo(2L)
                .userId("user2")
                .userPw("encodedPw")
                .userNm("김철수")
                .nickNm("nick2")
                .email("k@example.com")
                .emailHash("hash-email-2")
                .phone("011")
                .phoneHash("hash-phone-2")
                .statusCode("S01")
                .pwChangeRequired("Y")
                .roleCode("ROLE_USER")
                .build();

        when(userRepository.findByUserId("user2")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPw", "encodedPw")).thenReturn(true);

        TokenDTO issued = TokenDTO.builder()
                .grantType("Bearer")
                .accessToken("access")
                .refreshToken("refresh2")
                .userNm("김철수")
                .nickNm("nick2")
                .userNo(2L)
                .passwordChangeRequired(false)
                .build();

        when(jwtTokenProvider.createToken(any(Authentication.class), eq(2L), eq("김철수"), eq("nick2")))
                .thenReturn(issued);

        TokenDTO result = authService.login("user2", "rawPw");

        assertThat(result.isPasswordChangeRequired()).isTrue();
        verify(refreshTokenService).saveRefreshToken(2L, "refresh2");
    }

    @Test
    void login_존재하지않는userId_예외() {
        when(userRepository.findByUserId("ghost")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> authService.login("ghost", "pw"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);
        verifyNoInteractions(passwordEncoder, jwtTokenProvider, refreshTokenService);
    }

    @Test
    void login_비밀번호불일치_예외() {
        User user = User.builder()
                .userNo(3L)
                .userId("user3")
                .userPw("encodedPw")
                .userNm("이영희")
                .nickNm("nick3")
                .email("y@example.com")
                .emailHash("hash-email-3")
                .phone("012")
                .phoneHash("hash-phone-3")
                .statusCode("S01")
                .pwChangeRequired("N")
                .roleCode("ROLE_USER")
                .build();

        when(userRepository.findByUserId("user3")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encodedPw")).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class, () -> authService.login("user3", "wrong"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_PASSWORD);
        verifyNoInteractions(jwtTokenProvider, refreshTokenService);
    }

    @Test
    void login_이용정지계정_예외() {
        User user = User.builder()
                .userNo(4L)
                .userId("user4")
                .userPw("encodedPw")
                .userNm("정지유저")
                .nickNm("nick4")
                .email("b@example.com")
                .emailHash("hash-email-4")
                .phone("013")
                .phoneHash("hash-phone-4")
                .statusCode("S03")
                .pwChangeRequired("N")
                .roleCode("ROLE_USER")
                .build();

        when(userRepository.findByUserId("user4")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPw", "encodedPw")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> authService.login("user4", "rawPw"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED);
        verifyNoInteractions(jwtTokenProvider, refreshTokenService);
    }

    @Test
    void refresh_정상갱신_새TokenDTO반환() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("refreshToken", "plainToken")});
        when(jwtTokenProvider.validateToken("plainToken")).thenReturn(true);

        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("test@test.com");
        when(jwtTokenProvider.parseClaims("plainToken")).thenReturn(claims);

        when(hashUtil.generateHash(eq("test@test.com"))).thenReturn("emailHash");
        when(hashUtil.generateHash(eq("plainToken"))).thenReturn("hashedToken");

        User user = User.builder()
                .userNo(10L)
                .userId("refreshUser")
                .userPw("pw")
                .userNm("Name")
                .nickNm("Nick")
                .email("test@test.com")
                .emailHash("emailHash")
                .phone("010")
                .phoneHash("ph")
                .statusCode("S01")
                .pwChangeRequired("N")
                .roleCode("ROLE_USER")
                .build();
        when(userRepository.findByEmailHash("emailHash")).thenReturn(Optional.of(user));

        RefreshToken stored = RefreshToken.builder()
                .tokenId(1L)
                .userNo(10L)
                .tokenValue("hashedToken")
                .expireDt(LocalDateTime.now().plusDays(1))
                .build();
        when(refreshTokenService.findByUserNo(10L)).thenReturn(stored);

        TokenDTO issued = TokenDTO.builder()
                .grantType("Bearer")
                .accessToken("newAccess")
                .refreshToken("newRefresh")
                .userNm("Name")
                .nickNm("Nick")
                .userNo(10L)
                .passwordChangeRequired(false)
                .build();
        when(jwtTokenProvider.createToken(any(Authentication.class), eq(10L), eq("Name"), eq("Nick")))
                .thenReturn(issued);

        TokenDTO result = authService.refresh(request);

        assertThat(result).isNotNull();
        verify(refreshTokenService).deleteByUserNo(10L);
        verify(refreshTokenService).saveRefreshToken(10L, "newRefresh");
    }

    @Test
    void refresh_쿠키없음_예외() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getCookies()).thenReturn(null);

        CustomException ex = assertThrows(CustomException.class, () -> authService.refresh(request));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.EXPIRED_TOKEN);
        verifyNoInteractions(jwtTokenProvider, hashUtil, userRepository, refreshTokenService);
    }

    @Test
    void refresh_validateToken실패_예외() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("refreshToken", "invalidToken")});
        when(jwtTokenProvider.validateToken("invalidToken")).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class, () -> authService.refresh(request));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.EXPIRED_TOKEN);
        verifyNoInteractions(hashUtil, userRepository, refreshTokenService);
    }

    @Test
    void refresh_해시불일치_예외() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("refreshToken", "plainToken")});
        when(jwtTokenProvider.validateToken("plainToken")).thenReturn(true);

        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("test@test.com");
        when(jwtTokenProvider.parseClaims("plainToken")).thenReturn(claims);

        when(hashUtil.generateHash(eq("test@test.com"))).thenReturn("emailHash");
        when(hashUtil.generateHash(eq("plainToken"))).thenReturn("differentHash");

        User user = User.builder()
                .userNo(20L)
                .userId("u20")
                .userPw("pw")
                .userNm("U20")
                .nickNm("N20")
                .email("test@test.com")
                .emailHash("emailHash")
                .phone("010")
                .phoneHash("ph")
                .statusCode("S01")
                .pwChangeRequired("N")
                .roleCode("ROLE_USER")
                .build();
        when(userRepository.findByEmailHash("emailHash")).thenReturn(Optional.of(user));

        RefreshToken stored = RefreshToken.builder()
                .tokenId(2L)
                .userNo(20L)
                .tokenValue("storedHash")
                .expireDt(LocalDateTime.now().plusDays(1))
                .build();
        when(refreshTokenService.findByUserNo(20L)).thenReturn(stored);

        CustomException ex = assertThrows(CustomException.class, () -> authService.refresh(request));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_TOKEN);
        verify(refreshTokenService).deleteToken(stored);
        verify(refreshTokenService, never()).deleteByUserNo(anyLong());
        verify(refreshTokenService, never()).saveRefreshToken(anyLong(), any());
    }

    @Test
    void refresh_이용정지계정_예외() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("refreshToken", "plainToken")});
        when(jwtTokenProvider.validateToken("plainToken")).thenReturn(true);

        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("test@test.com");
        when(jwtTokenProvider.parseClaims("plainToken")).thenReturn(claims);

        when(hashUtil.generateHash(eq("test@test.com"))).thenReturn("emailHash");

        User user = User.builder()
                .userNo(30L)
                .userId("u306")
                .userPw("pw")
                .userNm("Blocked")
                .nickNm("B")
                .email("test@test.com")
                .emailHash("emailHash")
                .phone("010")
                .phoneHash("ph")
                .statusCode("S03")
                .pwChangeRequired("N")
                .roleCode("ROLE_USER")
                .build();
        when(userRepository.findByEmailHash("emailHash")).thenReturn(Optional.of(user));

        CustomException ex = assertThrows(CustomException.class, () -> authService.refresh(request));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED);
        verify(refreshTokenService, never()).findByUserNo(anyLong());
    }

    @Test
    void logout_정상로그아웃_delete호출확인() {
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(hashUtil.generateHash(eq("plainToken"))).thenReturn("hashedToken");

        RefreshToken entity = RefreshToken.builder()
                .tokenId(99L)
                .userNo(99L)
                .tokenValue("hashedToken")
                .expireDt(LocalDateTime.now().plusDays(1))
                .build();
        when(refreshTokenRepository.findByTokenValue("hashedToken")).thenReturn(Optional.of(entity));

        authService.logout("plainToken", response);

        verify(refreshTokenRepository).delete(entity);
        verify(response).addHeader(eq(HttpHeaders.SET_COOKIE), any());
    }

    @Test
    void logout_토큰DB없음_delete미호출_addHeader호출() {
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(hashUtil.generateHash(eq("plainToken"))).thenReturn("hashedToken");
        when(refreshTokenRepository.findByTokenValue("hashedToken")).thenReturn(Optional.empty());

        authService.logout("plainToken", response);

        verify(refreshTokenRepository, never()).delete(any(RefreshToken.class));
        verify(response).addHeader(eq(HttpHeaders.SET_COOKIE), any());
    }
}
