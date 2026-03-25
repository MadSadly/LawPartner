package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;

    /** 운영 시 application.properties에 app.websocket.allowed-origins=https://도메인 입력. 없으면 개발용 * */
    @org.springframework.beans.factory.annotation.Value("${app.websocket.allowed-origins:*}")
    private String allowedOriginPattern;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/sub");
        config.setApplicationDestinationPrefixes("/pub");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String pattern = (allowedOriginPattern != null && !allowedOriginPattern.isBlank()) ? allowedOriginPattern.trim() : "*";
        String[] patterns = pattern.contains(",") ? pattern.split("\\s*,\\s*") : new String[]{pattern};
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns(patterns)
                .withSockJS();
    }

    // ★★★ [핵심 추가] 웹소켓 CONNECT 시 JWT 검증 인터셉터
    // 이게 없으면 토큰 없이 연결되어 메시지 수신이 불규칙하게 작동함
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // CONNECT 프레임일 때만 검증 (연결 시 딱 1번)
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            Long userNo = jwtTokenProvider.getUserNoFromToken(token);
                            if (userNo != null) {
                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(
                                                userNo, null,
                                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                                        );
                                accessor.setUser(auth);
                            }
                        } catch (Exception e) {
                            System.err.println("[WebSocket] JWT 검증 실패: " + e.getMessage());
                        }
                    }
                }
                return message;
            }
        });
    }
}