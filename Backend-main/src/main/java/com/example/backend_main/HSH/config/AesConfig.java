/*
AES-256 키를 변경할 때만 사용하는 파일 처리..
필요할 시 재사용 !
*/

package com.example.backend_main.HSH.config;

import com.example.backend_main.common.util.Aes256Util;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class AesConfig {

    @Value("${encryption.aes256.key}")
    private String newKey;

    // 현재 사용하는 신규 키 전용 유틸
    // @Primary : aes 키를 사용하는 모든 클래스들은 신규 키 사용하게 처리..
    @Bean(name = "newAesUtil")
    @Primary
    public Aes256Util newAesUtil() {
        return new Aes256Util(newKey);
    }


}
