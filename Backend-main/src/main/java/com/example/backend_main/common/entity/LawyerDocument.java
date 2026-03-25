package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "TB_LAWYER_DOCUMENTS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class LawyerDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DOC_NO")
    private Long docNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_NO", nullable = false)
    private User user;

    @Column(name = "DOC_TYPE", nullable = false, length = 50)
    private String docType;

    @Column(name = "ORIGINAL_NAME", nullable = false, length = 500)
    private String originalName;

    @Column(name = "SAVED_NAME", nullable = false, length = 500)
    private String savedName;

    @Column(name = "FILE_PATH", nullable = false, length = 500)
    private String filePath;

    @Column(name = "FILE_SIZE")
    private Long fileSize;

    @CreatedDate
    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt;

    @Builder
    public LawyerDocument(User user, String docType, String originalName, String savedName, String filePath, Long fileSize) {
        this.user = user;
        this.docType = docType;
        this.originalName = originalName;
        this.savedName = savedName;
        this.filePath = filePath;
        this.fileSize = fileSize;
    }
}
