package com.example.backend_main.common.entity;

import com.example.backend_main.common.converter.Aes256Converter;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
 [User Entity]
 TB_USER 테이블과 1:1로 매핑되는 실제 데이터 본체입니다.
 회원가입 시 개인정보는 AES-256(양방향), 검색용 인덱스는 SHA-256(단방향)으로 저장됩니다.
*/
@Entity
@Table(name = "TB_USER")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_NO")
    private Long userNo; // 내부 관리 번호 (PK)

    @Column(name = "USER_ID", nullable = false, unique = true, length = 50)
    private String userId; // 로그인 아이디

    @Column(name = "USER_PW", nullable = false, length = 256)
    private String userPw; // 비밀번호 (BCrypt 암호화)

    @Column(name = "USER_NM", nullable = false, length = 50)
    private String userNm; // 실명

    @Column(name = "NICK_NM", length = 50, unique = true)
    private String nickNm;

    // ================= [이메일 & 휴대폰 (보안 설계 핵심)] =================

    //
    @Convert(converter = Aes256Converter.class)
    @Column(name = "EMAIL")
    private String email; // [연락용] AES-256 암호화 (복호화 가능)

    @Column(name = "EMAIL_HASH", nullable = false, length = 64)
    private String emailHash; // ★ [검색/중복체크용] SHA-256 해시 (복호화 불가, 고속 검색)

    @Convert(converter = Aes256Converter.class)
    @Column(name = "PHONE")
    private String phone; // [연락용] AES-256 암호화 (복호화 가능)

    @Column(name = "PHONE_HASH", nullable = false, length = 64)
    private String phoneHash; // ★ [검색/중복체크용] SHA-256 해시 (복호화 불가, 고속 검색)

    // =================================================================

    @Column(name = "ROLE_CODE", length = 20)
    @Builder.Default
    private String roleCode = "ROLE_USER"; // 권한 (ROLE_USER, ROLE_LAWYER, ROLE_ADMIN)

    @Column(name = "STATUS_CODE", length = 20)
    @Builder.Default
    private String statusCode = "S01"; // 상태 (S01:정상, S99:탈퇴 등)

    @Column(name = "PW_CHANGE_REQUIRED", length = 1)
    @Builder.Default
    private String pwChangeRequired = "N"; // 임시 비밀번호 사용 여부 (Y: 로그인 후 비밀번호 변경 필요)

    @Column(name = "FAIL_CNT")
    @Builder.Default
    private Integer failCnt = 0; // 로그인 실패 횟수

    @Column(name = "LOCK_DT")
    private LocalDateTime lockDt; // 계정 잠금 시작 시간

    @Column(name = "JOIN_DT", updatable = false)
    private LocalDateTime joinDt; // 가입 일시

    @Column(name = "PROFILE_IMG", length = 500)
    private String profileImg;

    // 엔티티가 저장되기 직전(PrePersist)에 실행되는 자동화 메서드
    @PrePersist
    public void prePersist() {
        this.joinDt = LocalDateTime.now();
    }

    // 변호사 정보와의 1:1 관계 설정
    // mappedBy = "user" : LawyerInfo 엔티티 안에 있는 'user' 필드가 주인이다!
    // cascade = CascadeType.ALL : 유저가 지워지면 변호사 정보도 같이 지워라!
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private LawyerInfo lawyerInfo;

    // 변호사인지 확인하는 편의 메서드
    public boolean isLawyer() {
        return "ROLE_ASSOCIATE".equals(this.roleCode);
    }
}