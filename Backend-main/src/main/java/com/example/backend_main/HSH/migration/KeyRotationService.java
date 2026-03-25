package com.example.backend_main.HSH.migration;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.Aes256Util;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Profile("migration")
@Service
@Slf4j
public class KeyRotationService {

    private final UserRepository userRepository;
    private final Aes256Util newAesUtil;
    private final Aes256Util oldAesUtil;

    public KeyRotationService(UserRepository userRepository,
                              @Qualifier("newAesUtil") Aes256Util newAesUtil,
                              @Qualifier("oldAesUtil") Aes256Util oldAesUtil) {
        this.userRepository = userRepository;
        this.newAesUtil = newAesUtil;
        this.oldAesUtil = oldAesUtil;
    }

    @Transactional
    public void rotateKeys() {
        List<User> users = userRepository.findAll();
        log.info("🔑 키 로테이션 시작: 총 {}명", users.size());

        for (User user : users) {
            try {
                // 1. 구형 키로 복호화 (이미 새 키인 경우를 위해 유연하게 처리)
                String plainEmail = decryptWithOldFirst(user.getEmail());

                // 2. 신규 키로 다시 암호화
                String reEncryptedEmail = newAesUtil.encrypt(plainEmail);

                // 3. DB 업데이트
                user.setEmail(reEncryptedEmail);

            } catch (Exception e) {
                log.error("❌ 유저 {} 처리 중 오류: {}", user.getUserId(), e.getMessage());
            }
        }
        log.info("✅ 모든 데이터의 보안 세대교체가 완료되었습니다.");
    }

    private String decryptWithOldFirst(String encrypted) throws Exception {
        try {
            return oldAesUtil.decrypt(encrypted); // 1. 먼저 옛날 키로 시도
        } catch (Exception e) {
            // 2. 실패하면 새 키로 시도 (이제 여기서 나는 에러는 메서드 밖으로 던져집니다)
            return newAesUtil.decrypt(encrypted);
        }
    }
}