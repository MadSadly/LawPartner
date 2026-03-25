package com.example.backend_main.common.converter;

import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.util.Aes256Util;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Converter
@RequiredArgsConstructor
@Slf4j
public class Aes256Converter implements AttributeConverter<String, String> {

    private final Aes256Util aes256Util;

    // 1. 자바 Entity -> DB 컬럼으로 갈 때 (암호화)
    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        try {
            return aes256Util.encrypt(attribute);
        } catch (Exception e) {
            log.error("🚨 [DB 저장 전 암호화 실패]: {}", e.getMessage());
            // 규격화된 에러 시스템을 사용
            throw new CustomException(ErrorCode.ENCRYPTION_ERROR);
        }
    }

    // 2. DB 컬럼 -> 자바 Entity로 올 때 (복호화)
    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }

        // S99 탈퇴 유저나 구형 데이터 방어 코드 (화면 뻗음 방지)
        if (dbData.startsWith("delete_") || dbData.startsWith("deleted_")) {
            return dbData;
        }

        try {
            return aes256Util.decrypt(dbData);
        } catch (Exception e) {
            // 🔑 조회 시 뻗어버리는 것을 막기 위해 에러를 던지지 않고 경고만 남긴 뒤 원본 반환
            // 필요시 추가 하기..
            // log.warn("⚠️ [복호화 스킵] 암호문이 아니거나 구형 데이터입니다: {}", dbData);
            return dbData;
        }
    }
}