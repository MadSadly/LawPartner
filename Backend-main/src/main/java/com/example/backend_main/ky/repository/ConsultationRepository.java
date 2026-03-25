package com.example.backend_main.ky.repository;

import com.example.backend_main.common.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/*
 * [KY] 대시보드용 상담(채팅방) 레포지토리
 * TB_CHAT_ROOM ↔ ChatRoom 엔티티 (common) 사용
 * 기존 KY/entity/Consultation 는 중복 엔티티였으므로 더 이상 사용하지 않습니다.
 */
public interface ConsultationRepository extends JpaRepository<ChatRoom, String> {

    // 특정 변호사의 상담 목록 (최신순)
    List<ChatRoom> findByLawyerNoOrderByRegDtDesc(Long lawyerNo);

    // 특정 변호사의 전체 상담 건수
    long countByLawyerNo(Long lawyerNo);

    // 특정 변호사의 진행 상태별 건수 (stats 용)
    long countByLawyerNoAndProgressCode(Long lawyerNo, String progressCode);
}