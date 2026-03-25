package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "TB_ADMIN_AUDIT")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AdminAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AUDIT_NO")
    private Long auditNo;

    @Column(name = "ADMIN_NO", nullable = false)
    private Long adminNo;

    @Column(name = "ADMIN_ID", length = 50)
    private String adminId;

    @Column(name = "ACTION_TYPE", nullable = false, length = 30)
    private String actionType;

    @Column(name = "TARGET_INFO", nullable = false, length = 200)
    private String targetInfo;

    @Column(name = "REASON", length = 200)
    private String reason;

    @Column(name = "TRACE_ID", length = 50)
    private String traceId;

    @Column(name = "ERROR_YN", length = 1)
    @Builder.Default
    private String errorYn = "N";

    @Column(name = "ERROR_MSG", length = 500)
    private String errorMsg;

    @Column(name = "REQ_IP", length = 50)
    private String reqIp;

    @Column(name = "USER_AGENT", length = 200)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt;
}