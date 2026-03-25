package com.example.backend_main.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private String roomId;
    private Long senderNo;
    private String message;
    private String msgType;
    private String fileUrl;
    /** 페이지네이션용: 이전 메시지 요청 시 'before' 커서로 사용 */
    private LocalDateTime sendDt;
}