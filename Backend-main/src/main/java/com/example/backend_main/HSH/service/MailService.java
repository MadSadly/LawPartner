package com.example.backend_main.HSH.service;

import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.util.MaskingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String defaultFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public void sendFindIdMail(String toEmail, String userId) {
        String subject = "[AI-Law] 아이디 찾기 안내";
        String text = String.format(
                "안녕하세요, AI-Law 입니다.\n\n" +
                "요청하신 계정의 아이디는 아래와 같습니다.\n\n" +
                "아이디: %s\n\n" +
                "본 메일을 요청하지 않으셨다면, 다른 사람이 잘못 입력했을 수 있습니다.\n" +
                "문의가 필요하시면 고객센터로 연락해주세요.\n\n" +
                "- AI-Law 드림 -",
                userId
        );

        send(toEmail, subject, text);
    }

    public void sendTempPasswordMail(String toEmail, String tempPassword) {
        String subject = "[AI-Law] 임시 비밀번호 안내";
        String text = String.format(
                "안녕하세요, AI-Law 입니다.\n\n" +
                "요청하신 계정의 임시 비밀번호를 안내드립니다.\n\n" +
                "임시 비밀번호: %s\n\n" +
                "보안을 위해 로그인 후 반드시 비밀번호를 변경해 주세요.\n" +
                "본 메일을 요청하지 않으셨다면 즉시 비밀번호 변경 또는 고객센터 문의를 권장드립니다.\n\n" +
                "- AI-Law 드림 -",
                tempPassword
        );

        send(toEmail, subject, text);
    }

    private void send(String toEmail, String subject, String text) {
        if (mailHost == null || mailHost.isBlank() || mailSender == null) {
            log.error("메일 발송 시도 실패 - 메일 설정 미구성 (spring.mail.host 미설정 또는 JavaMailSender 미등록)");
            throw new CustomException(ErrorCode.SYSTEM_ERROR, "메일 발송 기능이 비활성화된 환경입니다.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            if (defaultFrom != null && !defaultFrom.isEmpty()) {
                message.setFrom(defaultFrom);
            }
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("메일 전송 실패 - to: {}, subject: {}, error: {}",
                    MaskingUtil.maskEmail(toEmail), subject, e.getMessage());
            throw new CustomException(ErrorCode.SYSTEM_ERROR, "메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }
}

