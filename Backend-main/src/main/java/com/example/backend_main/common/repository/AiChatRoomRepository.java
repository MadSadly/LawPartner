package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.AiChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AiChatRoomRepository extends JpaRepository<AiChatRoom, Long> {

    @Query("""
            SELECT r
            FROM AiChatRoom r
            WHERE r.user.userNo = :userNo
            ORDER BY COALESCE(r.lastChatDt, r.regDt) DESC
            """)
    List<AiChatRoom> findByUserNoOrderByRecent(@Param("userNo") Long userNo);
}

