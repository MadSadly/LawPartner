package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 1. 알림 리스트 가져오기 (네가 짠 거)
    List<Notification> findTop10ByUserNoOrderByRegDtDesc(Long userNo);

    // ★ 2. 안 읽은 알림 개수 세기
    long countByUserNoAndReadYn(Long userNo, String readYn);

    // ★ 3. 특정 채팅방의 안 읽은 알림 개수 (대시보드 미읽음 뱃지용)
    long countByUserNoAndRoomIdAndReadYn(Long userNo, String roomId, String readYn);

    // ★ 3. 알림 모두 읽음 처리 (추가! DB 업데이트용)
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Notification n SET n.readYn = 'Y' WHERE n.userNo = :userNo AND n.readYn = 'N'")
    void markAllAsRead(@Param("userNo") Long userNo);

    // ★ 4. 특정 채팅방 알림 읽음 처리
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Notification n SET n.readYn = 'Y' WHERE n.userNo = :userNo AND n.roomId = :roomId AND n.readYn = 'N'")
    void markAllReadByUserNoAndRoomId(@Param("userNo") Long userNo, @Param("roomId") String roomId);
}