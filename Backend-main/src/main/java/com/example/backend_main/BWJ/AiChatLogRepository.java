package com.example.backend_main.BWJ;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.backend_main.dto.AiChatLog;

import java.time.LocalDateTime;
import java.util.List;

public interface AiChatLogRepository extends JpaRepository<AiChatLog,Long> {

    List<AiChatLog> findByRoom_RoomNoOrderByLogNoAsc(Long roomNo);

    /** 한국 시간 기준 일자 구간 내 해당 회원 AI 상담(로그) 건수 */
    @Query("SELECT COUNT(l) FROM AiChatLog l WHERE l.user.userNo = :userNo AND l.regDt >= :start AND l.regDt < :end")
    long countByUserNoAndRegDtRange(
            @Param("userNo") Long userNo,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
