package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // 특정 채팅방의 메시지 내역을 시간순으로 조회
    List<ChatMessage> findByRoomIdOrderBySendDtAsc(String roomId);

    java.util.Optional<ChatMessage> findTopByRoomIdOrderBySendDtDesc(String roomId);

    /** 최신 N개 (내림차순으로 가져온 뒤 호출 측에서 역순 사용) */
    List<ChatMessage> findByRoomIdOrderBySendDtDesc(String roomId, Pageable pageable);

    /** 특정 시각 이전 메시지 N개 (과거 더 보기용, 내림차순 반환) */
    List<ChatMessage> findByRoomIdAndSendDtBeforeOrderBySendDtDesc(String roomId, LocalDateTime before, Pageable pageable);
}