package com.example.backend_main.dto;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_BOARD_REPLY")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@DynamicInsert
public class BoardReply {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REPLY_NO")
    private Long replyNo;

    @Column(name = "BOARD_NO")
    private Long boardNo;

    // 변호사 ID (팀원 코드는 writerNo로 되어 있습니다)
    @Column(name = "WRITER_NO")
    private Long writerNo;

    @Column(name = "CONTENT", length = 4000, nullable = false)
    private String content;

    @Column(name = "SELECTION_YN")
    @ColumnDefault("'N'")
    private String selectionYn;

    @CreationTimestamp
    @Column(name = "REG_DT")
    private LocalDateTime regDt;

    // [추가됨] 화면에 변호사 이름을 보여주기 위한 임시 필드
    @Transient
    private String lawyerNm;
}