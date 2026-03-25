package com.example.backend_main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;


@EnableAsync // ★★★ 보안 모니터링 슬랙 알림 비동기 처리를 위해 필수
@EnableScheduling // ★★★ 보안 모니터링 초기화 스케줄러 작동을 위해 필수
@EnableJpaAuditing // ★★★ 이 어노테이션이 반드시 있어야 시간이 자동으로 들어갑니다!
@SpringBootApplication
public class BackendMainApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendMainApplication.class, args);
    }
}
