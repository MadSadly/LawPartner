package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "TB_CHAT_ROOM")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatRoom {

    @Id
    // ★ @GeneratedValue 자동 증가 옵션 삭제 (우리가 직접 UUID 문자를 넣을 거니까요!)
    @Column(name = "ROOM_ID", length = 50)
    private String roomId; // ★ Long에서 String으로 변경!

    @Column(name = "USER_NO", nullable = false)
    private Long userNo;

    @Column(name = "LAWYER_NO", nullable = false)
    private Long lawyerNo;

    @Column(name = "STATUS_CODE", length = 20)
    @Builder.Default
    private String statusCode = "OPEN";

    @Column(name = "PROGRESS_CODE", length = 20)
    @Builder.Default
    private String progressCode = "ST01"; // 초기값 '대기'

    @Column(name = "REG_DT")
    @Builder.Default
    private LocalDateTime regDt = LocalDateTime.now();

    // ★ 추가됨: 데이터베이스에 Insert 되기 직전에 자동으로 실행되어 빈 값을 채워줍니다.
    @PrePersist
    public void prePersist() {
        // roomId가 비어있으면 랜덤한 UUID 문자열(예: 550e8400-e29b-41d4-a716-446655440000)을 생성해서 넣습니다.
        if (this.roomId == null) {
            this.roomId = UUID.randomUUID().toString();
        }
        if (this.regDt == null) {
            this.regDt = LocalDateTime.now();
        }
    }
}