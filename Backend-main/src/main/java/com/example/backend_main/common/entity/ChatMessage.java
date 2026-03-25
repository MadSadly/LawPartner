package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_CHAT_MESSAGE")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MSG_NO")
    private Long msgNo;

    @Column(name = "ROOM_ID", length = 50, nullable = false)
    private String roomId;

    @Column(name = "SENDER_NO", nullable = false)
    private Long senderNo;

    @Column(name = "MESSAGE", length = 4000)
    private String message;

    @Column(name = "MSG_TYPE", length = 10)
    @Builder.Default
    private String msgType = "TEXT"; // TEXT, IMG, FILE, SYS

    @Column(name = "FILE_URL", length = 500)
    private String fileUrl;

    @Column(name = "READ_YN", length = 1)
    @Builder.Default
    private String readYn = "N";

    @Column(name = "SEND_DT")
    @Builder.Default
    private LocalDateTime sendDt = LocalDateTime.now();
}