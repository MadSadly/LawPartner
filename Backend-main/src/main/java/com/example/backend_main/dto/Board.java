package com.example.backend_main.dto;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDateTime;

@Entity
@Table(name = "TB_BOARD") // DB 테이블명 지정
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@DynamicInsert // default 값 적용을 위해 필요
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BOARD_NO")
    private Long boardNo;

    @Column(name = "CATEGORY_CODE", nullable = false, length = 200)
    private String categoryCode;

    @Column(name = "TITLE", nullable = false, length = 300)
    private String title;

    @Lob // Oracle CLOB 타입 매핑
    @Column(name = "CONTENT", nullable = false)
    private String content;

    @Column(name = "WRITER_NO", nullable = false)
    private Long writerNo; // 작성자 번호 (로그인 전이라 임시 사용)

    @Column(name = "SECRET_YN")
    @ColumnDefault("'N'")
    private String secretYn;

    @Column(name = "BLIND_YN")
    @ColumnDefault("'N'")
    private String blindYn;

    @Column(name = "HIT_CNT")
    @ColumnDefault("0")
    private Integer hitCnt;

    @CreationTimestamp
    @Column(name = "REG_DT")
    private LocalDateTime regDt;


    @Column(name = "NICKNAME_VISIBLE_YN", length = 1)
    @ColumnDefault("'N'")
    private String nicknameVisibleYn;

    @Column(name = "REPLY_CNT")
    @ColumnDefault("0")
    private Integer replyCnt;

    // [추가됨] 매칭 완료 여부 (Y/N)
    @Column(name = "MATCH_YN", length = 1)
    @ColumnDefault("'N'")
    private String matchYn;

    // [추가된 부분] 프론트로 닉네임을 전달하기 위한 임시 필드
    // DB 테이블의 컬럼으로는 생성되지 않도록 @Transient를 붙입니다.
    // (JPA에서는 일반적으로 별도의 DTO 클래스를 만들어서 응답하지만,
    // 현재 구조를 최대한 유지하기 위해 추가했습니다.)
    @Transient
    private String nickNm;
}