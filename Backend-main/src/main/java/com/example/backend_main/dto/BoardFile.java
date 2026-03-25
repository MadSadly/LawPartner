package com.example.backend_main.dto;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter @Setter
@Builder @NoArgsConstructor @AllArgsConstructor
@Table(name = "board_file") // DB 테이블 이름
public class BoardFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fileNo;

    private Long boardNo;      // 어떤 게시글의 파일인지
    private String originName; // 실제 파일명 (예: test.png)
    private String saveName;   // 서버에 저장된 파일명 (중복 방지용)
    private String filePath;   // 파일 저장 경로
}