package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "TB_ACCESS_LOG")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class) // 날짜 자동 주입 리스너
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LOG_NO")
    private Long logNo; // 로그 고유 번호 (PK)

    @Column(name = "TRACE_ID", length = 50)
    private String traceId; // 추적 ID (UUID)

    @Column(name = "REQ_IP", length = 50)
    private String reqIp; // 접속 IP

    @Column(name = "REQ_URI", length = 200)
    private String reqUri; // 요청 URL

    @Column(name = "USER_AGENT", length = 200)
    private String userAgent; // 브라우저/기기 정보

    @Column(name = "USER_NO")
    private Long userNo; // 회원 번호 (비회원은 null)

    // [추가] 응답 상태 코드 (예: 200, 403, 500)
    @Column(name = "STATUS_CODE")
    private Integer statusCode;

    // [추가] 실행 시간 (단위: ms)
    @Column(name = "EXEC_TIME")
    private Long execTime;

    // [추가] 에러 메시지 (실패 시에만 기록, 성공 시 null)
    @Column(name = "ERROR_MSG", length = 500)
    private String errorMsg;

    @CreatedDate // JPA가 insert 시점에 자동으로 현재 시간 주입
    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt;
}