/*
# 서버 시작할 때 강제 실행처리 하는 클래스 파일.
구형 키 - 신형 키로 변경할 때 사용
*/

package com.example.backend_main.HSH.migration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

// @Profile("migration") : migration이라는 프로필 서버를 켤 때만 작동하기
@Configuration
@Profile("migration")
@RequiredArgsConstructor
@Slf4j
public class ForceExecuteConfig {

    private final KeyRotationService keyRotationService;

    @Bean
    public CommandLineRunner executeNow() {
        return args -> {
            log.info("⚠️ [강제 실행] 서버 기동과 동시에 키 로테이션을 시작합니다!");
            try {
                keyRotationService.rotateKeys();
                log.info("✅ [강제 실행] 성공적으로 완료되었습니다.");
            } catch (Exception e) {
                log.error("❌ [강제 실행] 실패: {}", e.getMessage());
            }
        };
    }
}

