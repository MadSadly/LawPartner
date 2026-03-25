package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.common.util.PasswordUtil;
import com.example.backend_main.dto.HSH_DTO.FindIdRequestDto;
import com.example.backend_main.dto.HSH_DTO.FindPasswordRequestDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FindAccountServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private HashUtil hashUtil;
    @Mock
    private MailService mailService;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private FindAccountService findAccountService;

    @Test
    void sendUserIdByEmail_정상_메일발송및마스킹반환() {
        FindIdRequestDto dto = new FindIdRequestDto();
        dto.setUserNm("홍길동");
        dto.setEmail("test@test.com");

        when(hashUtil.generateHash(eq("test@test.com"))).thenReturn("emailHash");

        User user = User.builder()
                .userId("testUser123")
                .email("test@test.com")
                .build();
        when(userRepository.findByUserNmAndEmailHash("홍길동", "emailHash"))
                .thenReturn(Optional.of(user));

        String result = findAccountService.sendUserIdByEmail(dto);

        assertThat(result).isNotNull();
        verify(mailService).sendFindIdMail(eq("test@test.com"), eq("testUser123"));
    }

    @Test
    void sendUserIdByEmail_유저없음_예외() {
        FindIdRequestDto dto = new FindIdRequestDto();
        dto.setUserNm("홍길동");
        dto.setEmail("test@test.com");

        when(hashUtil.generateHash(eq("test@test.com"))).thenReturn("emailHash");
        when(userRepository.findByUserNmAndEmailHash("홍길동", "emailHash"))
                .thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> findAccountService.sendUserIdByEmail(dto));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);
        verify(mailService, never()).sendFindIdMail(any(), any());
    }

    @Test
    void resetPasswordAndSendTempPassword_정상_필드변경및메일발송() {
        FindPasswordRequestDto dto = new FindPasswordRequestDto();
        dto.setUserId("testUser123");
        dto.setUserNm("홍길동");
        dto.setEmail("test@test.com");

        when(hashUtil.generateHash(eq("test@test.com"))).thenReturn("emailHash");

        User user = User.builder()
                .userId("testUser123")
                .userNm("홍길동")
                .email("test@test.com")
                .build();
        when(userRepository.findByUserIdAndUserNmAndEmailHash("testUser123", "홍길동", "emailHash"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.encode(eq("fixedTempPw"))).thenReturn("ENCODED_DUMMY");

        try (MockedStatic<PasswordUtil> pwd = mockStatic(PasswordUtil.class)) {
            pwd.when(PasswordUtil::generateTempPassword).thenReturn("fixedTempPw");
            findAccountService.resetPasswordAndSendTempPassword(dto);
        }

        assertThat(user.getUserPw()).isEqualTo("ENCODED_DUMMY");
        assertThat(user.getPwChangeRequired()).isEqualTo("Y");
        verify(mailService).sendTempPasswordMail(eq("test@test.com"), eq("fixedTempPw"));
    }

    @Test
    void resetPasswordAndSendTempPassword_유저없음_예외() {
        FindPasswordRequestDto dto = new FindPasswordRequestDto();
        dto.setUserId("testUser123");
        dto.setUserNm("홍길동");
        dto.setEmail("test@test.com");

        when(hashUtil.generateHash(eq("test@test.com"))).thenReturn("emailHash");
        when(userRepository.findByUserIdAndUserNmAndEmailHash("testUser123", "홍길동", "emailHash"))
                .thenReturn(Optional.empty());

        CustomException ex = assertThrows(
                CustomException.class,
                () -> findAccountService.resetPasswordAndSendTempPassword(dto));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);
        verify(mailService, never()).sendTempPasswordMail(any(), any());
    }
}
