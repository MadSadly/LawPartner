package com.example.backend_main.common.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "TB_BANNED_WORD")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BannedWord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "WORD_NO")
    private Long wordNo;

    @Column(name = "WORD", nullable = false, unique = true, length = 100)
    private String word;

    @Column(name = "ADMIN_NO", nullable = false)
    private Long adminNo;

    @Column(name = "REASON", length = 500)  // ✅ 추가
    private String reason;

    @Column(name = "REG_DT", insertable = false, updatable = false)
    private Date regDt;
}

