package com.example.backend_main.HSH.service;

import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class MailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private MailService mailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(mailService, "mailHost", "smtp.test.com");
        ReflectionTestUtils.setField(mailService, "defaultFrom", "noreply@test.com");
        ReflectionTestUtils.setField(mailService, "mailSender", mailSender);
    }

    @Test
    void sendFindIdMail_SMTP미설정_예외() {
        ReflectionTestUtils.setField(mailService, "mailSender", null);

        CustomException ex = assertThrows(
                CustomException.class,
                () -> mailService.sendFindIdMail("to@test.com", "testUser"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SYSTEM_ERROR);
    }

    @Test
    void sendFindIdMail_정상발송_send호출확인() {
        mailService.sendFindIdMail("to@test.com", "testUser");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage captured = captor.getValue();
        assertThat(captured.getSubject()).contains("아이디");
        assertThat(captured.getText()).contains("testUser");
    }

    @Test
    void sendTempPasswordMail_SMTP미설정_예외() {
        ReflectionTestUtils.setField(mailService, "mailSender", null);

        CustomException ex = assertThrows(
                CustomException.class,
                () -> mailService.sendTempPasswordMail("to@test.com", "tmpPw123!"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SYSTEM_ERROR);
    }

    @Test
    void sendTempPasswordMail_정상발송_send호출확인() {
        mailService.sendTempPasswordMail("to@test.com", "tmpPw123!");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage captured = captor.getValue();
        assertThat(captured.getSubject()).contains("임시 비밀번호");
        assertThat(captured.getText()).contains("tmpPw123!");
    }
}
