package com.example.backend_main.ky.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
 [Review Entity]
 TB_REVIEW 테이블 매핑
 WRITER_NM 은 DB에 없음 → Service에서 UserRepository로 JOIN
*/
@Entity
@Table(name = "TB_REVIEW")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REVIEW_NO")
    private Long reviewNo;

    @Column(name = "LAWYER_NO", nullable = false)
    private Long lawyerNo;

    @Column(name = "WRITER_NO", nullable = false)
    private Long writerNo;       // TB_USER 에서 이름 조회용

    @Column(name = "RATING")
    private Double stars;        // TB_REVIEW.RATING NUMBER(2,1) → 소수점 지원

    @Column(name = "CONTENT", length = 1000)
    private String content;

    @Column(name = "REPLY_NO")
    private Long replyNo;

    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt;

    @PrePersist
    public void prePersist() {
        if (this.regDt == null) this.regDt = LocalDateTime.now();
    }
}
