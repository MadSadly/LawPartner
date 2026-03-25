package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "TB_CALENDAR_EVENT")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EVENT_NO")
    private Long eventNo;

    @Column(name = "ROOM_ID")
    private String roomId;

    @Column(name = "USER_NO", nullable = false)
    private Long userNo;

    @Column(name = "LAWYER_NO")
    private Long lawyerNo;

    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "START_DATE", nullable = false)
    private String startDate; // DB에는 문자열로 저장하기로 함 (예: 2026-02-15)

    @Column(name = "COLOR_CODE")
    private String colorCode;

    @Column(name = "REG_DT", insertable = false, updatable = false)
    private LocalDateTime regDt;


}