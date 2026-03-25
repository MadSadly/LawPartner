package com.example.backend_main.security;

import com.example.backend_main.HSH.service.CustomUserDetailsService;
import com.example.backend_main.common.security.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; // ★ 이 import가 필요합니다!
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

import java.util.List;
@Configuration
// @EnableMethodSecurity : 컨틀로러의 메소드 위에 붙은 @PreAuthorize가 살아있는 코드로 변함
// 만일 없을 경우 권한 체크가 무시하됨..!
@EnableWebSecurity
// ★ [핵심] 이 줄이 있어야 컨트롤러의 권한 체크가 작동합니다!
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true)
// Page 객체를 DTO 방식으로 예쁘게 직렬화 시키는 설정!
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
// JwtTokenProvider를 가져오기 위해 필요합니당~
@RequiredArgsConstructor
public class SecurityConfig {
    // 신분증 확인 기계 가져오기..!
    private final JwtTokenProvider jwtTokenProvider;
    // 401 - 입구 보안관 가져오기! (인증 실패)
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    // 403 - 방문 보안관 가져오기!
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    // 401과 403처리를 다른 곳에서 한 이유
    // 401 : 인증 실패 - 입구 컷 (신분증 -JWT가 없음)
    // 403 : 인가 실패 - 권한 컷 (입장은 했으나, JWT 권한에 막힘)
    private final CustomUserDetailsService customUserDetailsService;

    // 비밀번호 암호기 등록하기.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 보안 끄기 (REST API 방식에서는 필수)
                // csrf : 스프링 시큐리티가 제공하는 CsrfConfigurer 객체 (설정을 담당하는 일꾼)
                // --> 사이트 간 요청 위조하기..!
                // JWT와 Stateless 방식을 사용하기 때문에 모든 요청마다 리액트가 헤더에 JWT(신분증)을 실어서 보내기..!
                // 해커가 가짜 사이트에서 요청을 보내도, CSRF 공격 자체가 성립 불가..
                // 그러나, 개발만 복잡하기 때문에 REST API에서는 보통 비활성화 처리..
                // csrf.disable() : CSRF 보안 기능을 꺼라..!
                // AbstractHttpConfigurer : 스프링 시큐리티의 설정 일꾼들(CsrfConfigurer 등)은 모두 이 조상님 클래스에서 상속 받아 만들어짐
                // disable : 모든 설정을 공통적으로 끄는 기능(disable()) 사용
                // 콜론 두 개(::) : 메섣드 참조 연산자로, 람다식을 더 짧게 줄인 것. (csrf -> csrf.disable())
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .xssProtection(Customizer.withDefaults())
                )

                // 2. CORS 설정 적용 (리액트와의 연결 통로)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. 세션 사용 안함 (JWT를 쓸 거니까 '무상태'로 설정!)
                // 세션을 보통 아이디를 확인하지만 JWT를 사용함으로 인해 JWT내부에 있는 이름과 권한을 사용할 것이기 때문!
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 401 - 403 에러를 처리할 보안관을 등록!
                .exceptionHandling(exception -> exception
                        // [401 담당] 신분증 없을 때
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        // [403 담당] 권한 모자랄 때 -> JwtAccessDeniedHandler
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                )

                // 4. 페이지별 출입 권한 설정
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/lawyers/**",
                                "/api/boards/**",
                                "/api/ai/**",
                                "/api/chat/files/download/**",
                                "/images/profiles/**",
                                "/uploads/**",
                                "/ws-stomp/**",
                                "/sub/**",
                                "/pub/**"
                        ).permitAll()
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "OPERATOR")
                        .anyRequest().authenticated()
                )

                // 5. JWT 문지기 배치 (기본 문지기 앞에 우리 문지기를 세웁니다)
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, customUserDetailsService),
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS 허용 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 리액트 주소(3000) 허용
        configuration.setAllowedOrigins(List.of("http://192.168.0.43:3000", "http://localhost:3000"));

        // 모든 메소드 허용
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 모든 헤더 허용
        configuration.setAllowedHeaders(List.of("*"));
        /*
        - [운영 환경 적용] 모든 헤더(*) 대신 실제 사용하는 헤더만 명시
        configuration.setAllowedHeaders(List.of(
                "Authorization",      // JWT 토큰 전달용
                "Content-Type",       // JSON 데이터 전달용
                "Cache-Control",
                "X-Requested-With"    // AJAX 요청 확인용
        ));

        - 브라우저가 위 헤더들을 읽을 수 있도록 노출 설정
        configuration.setExposedHeaders(List.of("Authorization"));
        */
        // 쿠키나 인증 정보 포함 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


}