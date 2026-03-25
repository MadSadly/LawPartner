package com.example.backend_main.dto;

import com.example.backend_main.common.entity.AiChatRoom;
import com.example.backend_main.common.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "TB_AI_CHAT_LOG")
public class AiChatLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LOG_NO")
    private Long logNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROOM_NO")
    private AiChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_NO")
    private User user;

    @Column(name = "CATEGORY_CODE", length = 20)
    private String categoryCode;

    @Column(name = "QUESTION", length = 4000)
    private String question;

    @Lob
    @Column(name = "ANSWER")
    private String answer;

    @Column(name = "TOKEN_USAGE")
    private Long tokenUsage;

    /**
     * 관련 판례 목록을 직렬화해서 저장하는 컬럼.
     * 파이썬 서버에서 받은 related_cases(List<String>)를
     * 줄바꿈 구분 문자열로 합쳐서 저장하고,
     * 조회 시 다시 분리해서 사용한다.
     */
    @Lob
    @Column(name = "RELATED_CASES")
    private String relatedCases;

    @CreationTimestamp
    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt;
}