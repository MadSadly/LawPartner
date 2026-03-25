package com.example.backend_main.HSH.migration; // 경로 확인!

import com.example.backend_main.common.util.Aes256Util;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("migration") // ★ 이 글자가 있으면 평소엔 이 파일이 아예 무시됩니다.
public class AesMigrationConfig {

    @Value("${encryption.aes256.old-key}")
    private String oldKey;

    // 마이그레이션(키 교체) 때만 필요한 구형 키 기계
    // KeyRotationService에서 @Qualifier("oldAesUtil")에서 사용되는 빈
    @Bean(name = "oldAesUtil")
    public Aes256Util oldAesUtil() {
        return new Aes256Util(oldKey);
    }
}