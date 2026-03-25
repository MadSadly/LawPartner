package com.example.backend_main.common.util;

import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Component
public class HashUtil {

    // SHA-256 해시 생성 (복호화 불가능, 항상 같은 값 출력)
    public String generateHash(String input) {
        try {
            if (input == null) return null;

            // 1. SHA-256 알고리즘 준비
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // 2. 해싱 수행
            // StandardCharsets.UTF_8 : 깨지 않도록 UTF-8로 변환해서 입력.

            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));

            // 3. 바이트 배열을 깔끔한 Base64 문자열로 변환

            return Base64.getEncoder().encodeToString(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("해시 알고리즘 오류", e);
        }
    }
}