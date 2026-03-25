package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "TB_AI_CHAT_ROOM")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AiChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROOM_NO")
    private Long roomNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_NO")
    private User user;

    @Column(name = "TITLE", length = 200)
    private String title;

    @Lob
    @Column(name = "LAST_QUESTION")
    private String lastQuestion;

    @CreationTimestamp
    @Column(name = "REG_DT", nullable = false, updatable = false)
    private LocalDateTime regDt;

    @UpdateTimestamp
    @Column(name = "UPD_DT", nullable = false)
    private LocalDateTime updDt;

    @Column(name = "LAST_CHAT_DT")
    private LocalDateTime lastChatDt;

    public void touchLastChat(String question) {
        this.lastChatDt = LocalDateTime.now();
        this.lastQuestion = question;
        if (this.title == null || this.title.isBlank()) {
            this.title = question == null ? null : question.trim();
        }
    }

    public void ensureTitleMaxLength(int maxLen) {
        if (this.title != null && this.title.length() > maxLen) {
            this.title = this.title.substring(0, maxLen);
        }
    }
}

