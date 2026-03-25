package com.example.backend_main.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 1:1 채팅방 요청(생성 또는 기존 대기/진행 방 재사용) API 응답.
 * {@code newlyCreated == true}일 때만 클라이언트가 알림(notify) API를 호출하면 된다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomRequestResultDTO {
    private String roomId;
    private Long userNo;
    private Long lawyerNo;
    private String progressCode;
    private boolean newlyCreated;
}
