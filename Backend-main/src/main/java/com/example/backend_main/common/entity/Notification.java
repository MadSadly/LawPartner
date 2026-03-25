package com.example.backend_main.common.entity;

import jakarta.persistence.*; // 스프링 버전에 따라 javax.persistence 일 수도 있음
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_NOTIFICATION")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ALARM_NO")
    private Long alarmNo;

    @Column(name = "USER_NO", nullable = false)
    private Long userNo;

    @Column(name = "MSG_TITLE", length = 100)
    private String msgTitle;

    @Column(name = "MSG_CONTENT", length = 500)
    private String msgContent;

    @Column(name = "READ_YN", length = 1, columnDefinition = "CHAR(1) DEFAULT 'N'")
    @Builder.Default
    private String readYn = "N";

    @Column(name = "REG_DT", updatable = false)
    @Builder.Default
    private LocalDateTime regDt = LocalDateTime.now();

    @Column(name = "ROOM_ID", length = 100)
    private String roomId;
}