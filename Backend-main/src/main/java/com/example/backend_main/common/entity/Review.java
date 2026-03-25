package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity(name = "LawyerReview")
@Table(name = "TB_REVIEW")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REVIEW_NO")
    private Long reviewNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "LAWYER_NO", nullable = false)
    private LawyerInfo lawyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "WRITER_NO", nullable = false)
    private User writer;

    @Column(name = "RATING", precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(name = "CONTENT", length = 1000)
    private String content;

    @Column(name = "REG_DT")
    private LocalDateTime regDt;

    @PrePersist
    public void prePersist() {
        if (this.regDt == null) this.regDt = LocalDateTime.now();
    }

    @Column(name = "REPLY_NO")
    private Long replyNo;

    @Column(name = "WRITER_NM", length = 50)
    private String writerNm;
}