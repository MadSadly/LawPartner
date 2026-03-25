package com.example.backend_main.ky.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class PaymentConfig {

    // 포트원 서버에 HTTP 요청 보낼 때 쓰는 도구
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}