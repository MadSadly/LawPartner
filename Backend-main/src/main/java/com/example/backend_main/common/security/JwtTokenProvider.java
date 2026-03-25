package com.example.backend_main.common.security;

import com.example.backend_main.dto.HSH_DTO.TokenDTO;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;
    // tokenValidityInMilliseconds : 신분증의 유통기한 = 60분
    // toMillis() : 밀리초 단위로 변환
    // SecretKey key : 문자열 secretKey를 디지털 세상에서 사용할 수 있는 진짜 열쇠 객체로 변환
    private final long tokenValidityInMilliseconds = Duration.ofMinutes(60).toMillis();
    // 리프레시 토큰 유효기간: 7일 (★ 이 부분이 추가되어야 합니다!)
    private final long refreshTokenValidityInMilliseconds = Duration.ofDays(7).toMillis();
    private SecretKey key;

    // @PostConstruct : 객체가 생성된 직후 딱 한 번만 실행..
    // 즉, secretKey 문자열을 가져와서 HMAC-SHA 알고리즘에 적합한 디지털 열쇠(key)로 정교하게 깎기
    // HMAC-SHA : 해시함수 + 비밀 키를 함께 사용해 메시지 인증 코드를 만들기!
    @PostConstruct
    protected void init() {
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // 1. 토큰 생성
    // Authentication : 로그인한 살마의 정보가 담긴 객체
    // Long userNo : DB조회 성능을 위해 추가한 회원의 고유 번호
    public TokenDTO createToken(Authentication authentication, Long userNo, String userNm, String nickNm) {
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        // now : 현재 시간
        // tokenValidityInMilliseconds : 설정한 토큰의 수명 = 60분
        // 현재 시간과 더해서 하루 뒤인 시간으로 만들기!
        long now = (new Date()).getTime();
        Date accessTokenExpiresIn = new Date(now + tokenValidityInMilliseconds); // 1일

        String accessToken = Jwts.builder()
                .subject(authentication.getName())                      // 이메일 (누구인가?)         - 주인
                .claim("role", authorities)                          // 권한 (무엇을 할 수 있는가?) - 추가
                .claim("userNo", userNo)                             // 회원 번호(DB 식별자)       - 추가
                .claim("userNm", userNm)                             // 회원 이름               - 추가
                .claim("nickNm", nickNm)                             // 회원 닉네임
                .expiration(accessTokenExpiresIn)                       // 유효기간 설정
                .signWith(key)                                          // 우리 열쇠로 서명(위조 방지)
                .compact();                                             // 한 줄의 문자열로 압축하기.
        
        // 리프레시 토큰 설정
        String refreshToken = Jwts.builder()
                .subject(authentication.getName()) // 누구 건지 이름표는 붙여주자!
                .expiration(new Date(now + refreshTokenValidityInMilliseconds))
                .signWith(key)
                .compact();

        // 토큰 보내주기.. 
        return TokenDTO.builder()
                /*
                .builder() : 룸복(Lombok)의 빌더 패턴
                    - 생성자에 파라미터를 순서대로 넣다가 실수하는 일 방지 및 필드에 어떤 값을 넣는지 명확히 보여줌
                .grantType("Bearer") : 토큰이 어떤 방식의 인증인지 명시!
                    - [Bearer]은 이 토큰을 가진 사람을 인증된 자로 간주하라는 뜻의 전세계 공통 표준 규격
                .accessToken(accessToken) : 우리가 정교하게 만든 JWT 문자열 담기
                .build() : 설계를 마치고, 실제 TokenDTO 객체를 완성해 반환시켜주기 (리엑트로)
                 */
                .grantType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userNm(userNm)
                .nickNm(nickNm)
                .role(authorities)
                .email(authentication.getName()) // ★ 누락된 이메일 추가 (Subject)
                .userNo(userNo)                  // ★ 누락된 유저 번호 추가
                .build();
    }

    // 2. 토큰 파싱
    public Claims parseClaims(String accessToken) {
        try {
            return Jwts.parser()
                    .verifyWith(key)                    // 열쇠를 꽂고
                    .build()                            // 해독기 조립
                    .parseSignedClaims(accessToken)     // 신분증 해독
                    .getPayload();                      // 내용물(Claims)만 쏙 꺼내기
        } catch (ExpiredJwtException e) {
            return e.getClaims();                       // 만료돠었어도 일단 내용 확인하기..
        }
    }

    // 3. 토큰 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parser()                           // 1. [해독기] 꺼내기
                    .verifyWith(key)                // 2. [비밀 열쇠] 꺼내기
                    .build()                        // 3. [해독기] 조립 끝
                    .parseSignedClaims(token);      // 4. 신분증 넣고 [돌리기]
            return true;                            // 5. 문제 없으면 true!
        } catch (JwtException | IllegalArgumentException e) {
            // 서명이 틀렸거나, 유효기간이 끝났거나, 형식이 이상하면 실행!
            return false;                           // 5. 문제 있으면 false!
        }
    }

    // 4. 인증 객체 생성 (LoggingAspect 성능 향상을 위해 userNo를 details에 저장)
    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);     // 토큰 내용물 꺼내기

        if (claims.get("role") == null) {
            throw new RuntimeException("권한 정보가 없는 토큰입니다.");
        }

        Collection<? extends SimpleGrantedAuthority> authorities =
                Arrays.stream(claims.get("role").toString().split(","))     // 1단계
                        .map(SimpleGrantedAuthority::new)                         // 2단계
                        .collect(Collectors.toList());                            // 3단계
        /*
        1단계 (split) : "ROLE_USER,ROLE_ADMIN" 이라는 문자열을 ["ROLE_USER", "ROLE_ADMIN"] 이라는 배열로 쪼갠 후,
                        이를 한 줄로 세우기(stream)
        2단계 (map) : 한 줄로 선 문자열 하나하나를 가져와서 [SimpleGrantedAuthority] 라는 [권한 배지](객체)로 새로 만들기
                     스프링 시큐리티는 문자열이 아니라 이 [배지]가 있어야 권한을 인정해주기 때문에
        3단계 (collect) : 만들어진 배지들을 다시 예쁜 리스트(List)에 담아서 마무리하기.
        */


        // principal : 신분증 주인(이메일)과 권한을 담은 핵심 정보 객체
        // authentication : 이를 감싼 최종 [공식 통행증]
        User principal = new User(claims.getSubject(), "", authorities);

        // 인증 토큰 생성
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, token, authorities);

        // [중요] LoggingAspect에서 DB 조회 없이 userNo를 꺼낼 수 있도록 details에 저장!
        Map<String, Object> details = new HashMap<>();
        details.put("userNo", claims.get("userNo", Long.class));
        details.put("userNm", claims.get("userNm", String.class));
        authentication.setDetails(details);
        // setDetails(userNo) : 신분증에 적혀있던 userNo/Nm를 통행증의 [비고란(Details)]에 적어두기

        return authentication;
    }

    // 5. 토큰에서 userNo만 바로 꺼내기 (에러 해결)
    public Long getUserNoFromToken(String token) {
        return parseClaims(token).get("userNo", Long.class);
    }

    /**
     * Authorization 헤더에서 순수 토큰 문자열만 추출.
     *
     * @param authorization "Bearer &lt;token&gt;" 또는 null
     * @return 토큰 문자열, 또는 null (헤더 없음/형식 오류 시)
     */
    public String getTokenFromAuthorizationHeader(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring(7);
        return (token != null && !token.isBlank()) ? token : null;
    }

    /**
     * Authorization 헤더에서 userNo를 안전하게 추출하는 공통 메서드.
     * null/빈값/Bearer 미포함/토큰 무효 시 null 반환.
     *
     * @param authorization "Bearer &lt;token&gt;" 또는 null
     * @return userNo, 또는 null (헤더 없음/형식 오류/토큰 무효 시)
     */
    public Long getUserNoFromAuthorizationHeader(String authorization) {
        String token = getTokenFromAuthorizationHeader(authorization);
        if (token == null) return null;
        try {
            return getUserNoFromToken(token);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}