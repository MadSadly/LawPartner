package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "TB_LAWYER_INFO")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LawyerInfo {

    @Id
    @Column(name = "USER_NO")
    private Long userNo;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "USER_NO")
    private User user;

    @Column(name = "LICENSE_FILE", nullable = false, length = 500)
    private String licenseFile;

    @Column(name = "LICENSE_NO", length = 100)
    private String licenseNo;

    @Column(name = "OFFICE_NAME", length = 100)
    private String officeName;

    @Column(name = "OFFICE_ADDR", length = 200)
    private String officeAddr;

    @Column(name = "EXAM_TYPE", length = 50)
    private String examType;

    @Column(name = "INTRO_TEXT", length = 4000)
    private String introText;

    @Column(name = "IMG_URL", length = 500)
    private String imgUrl;

    @Column(name = "APPROVAL_YN", length = 1)
    private String approvalYn; // 'Y'/'N'

    @Column(name = "SUB_EXPIRE_DT")
    @Temporal(TemporalType.DATE)
    private Date subExpireDt;

    @Column(name = "SPECIALTY_STR", length = 1000)
    private String specialtyStr;

    @OneToMany(mappedBy = "lawyer", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    // 엔티티 스스로 승인 상태로 변경하는 메서드
    public void approve() {
        this.approvalYn = "Y";
    }
    // 혹시 모를 반려 처리
    public void reject() {
        this.approvalYn = "N";
    }
}