package com.example.backend_main.HSH.service;

import com.example.backend_main.common.util.MaskingUtil;
import com.example.backend_main.common.util.PasswordUtil;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.HSH_DTO.FindIdRequestDto;
import com.example.backend_main.dto.HSH_DTO.FindPasswordRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FindAccountService {

    private final UserRepository userRepository;
    private final HashUtil hashUtil;
    private final MailService mailService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 아이디 찾기: 이름 + 이메일을 받아 EMAIL_HASH로 사용자 조회 후,
     * 등록된 이메일로 아이디를 전송하고, 마스킹된 아이디를 반환한다.
     */
    @Transactional
    public String sendUserIdByEmail(FindIdRequestDto dto) {
        String emailHash = hashUtil.generateHash(dto.getEmail());

        Optional<User> optionalUser = userRepository.findByUserNmAndEmailHash(dto.getUserNm(), emailHash);
        if (optionalUser.isEmpty()) {
            log.warn("[FindAccount] 아이디 찾기 실패 - 이메일 미존재: {}", MaskingUtil.maskEmail(dto.getEmail()));
            throw new CustomException(ErrorCode.USER_NOT_FOUND, "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
        }

        User user = optionalUser.get();
        String email = user.getEmail(); // Aes256Converter를 통한 자동 복호화
        mailService.sendFindIdMail(email, user.getUserId());
        log.info("[FindAccount] 아이디 찾기 성공 - email: {}", MaskingUtil.maskEmail(dto.getEmail()));

        return MaskingUtil.maskUserId(user.getUserId());
    }

    /**
     * 비밀번호 찾기: 아이디 + 이름 + 이메일을 검증 후,
     * 임시 비밀번호를 생성하여 저장(해시)하고, 이메일로 전송한다.
     * 저장 시 PW_CHANGE_REQUIRED = 'Y' 로 설정한다.
     */
    @Transactional
    public void resetPasswordAndSendTempPassword(FindPasswordRequestDto dto) {
        String emailHash = hashUtil.generateHash(dto.getEmail());

        Optional<User> optionalUser = userRepository.findByUserIdAndUserNmAndEmailHash(
                dto.getUserId(),
                dto.getUserNm(),
                emailHash
        );

        if (optionalUser.isEmpty()) {
            log.warn("[FindAccount] 비밀번호 찾기 실패 - 사용자 미존재: {}", MaskingUtil.maskEmail(dto.getEmail()));
            throw new CustomException(ErrorCode.USER_NOT_FOUND, "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
        }

        User user = optionalUser.get();

        String tempPassword = PasswordUtil.generateTempPassword();
        String encoded = passwordEncoder.encode(tempPassword);

        user.setUserPw(encoded);
        user.setPwChangeRequired("Y");

        String email = user.getEmail();
        mailService.sendTempPasswordMail(email, tempPassword);
        log.info("[FindAccount] 임시 비밀번호 발급 완료 - email: {}", MaskingUtil.maskEmail(dto.getEmail()));
    }

}

