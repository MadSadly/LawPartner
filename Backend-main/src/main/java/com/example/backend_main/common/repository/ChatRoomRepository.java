package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
// ★ JpaRepository<ChatRoom, Long> 에서 JpaRepository<ChatRoom, String> 으로 변경
public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
    // 팩트: 라!내가 의뢰인인 방 또는 내가 변호사인 방 다 가져와
    List<ChatRoom> findByUserNoOrLawyerNoOrderByRegDtDesc(Long userNo, Long lawyerNo);

    List<ChatRoom> findByLawyerNoAndProgressCode(Long lawyerNo, String progressCode);

    List<ChatRoom> findByUserNoAndProgressCode(Long userNo, String progressCode);

    List<ChatRoom> findByUserNoOrderByRegDtDesc(Long userNo);

    // 변호사용: 나한테 온 대기(ST01) 중인 상담 요청 개수
    int countByLawyerNoAndProgressCode(Long lawyerNo, String progressCode);

    // 일반인용: 내가 신청한 것 중 수락(ST02)된 상담 개수
    int countByUserNoAndProgressCode(Long userNo, String progressCode);

    // [KY] 대시보드용: 변호사의 상담 목록 (최신순)
    List<ChatRoom> findByLawyerNoOrderByRegDtDesc(Long lawyerNo);

    // [KY] 대시보드용: 변호사의 전체 상담 건수
    long countByLawyerNo(Long lawyerNo);

    /** 동일 의뢰인·변호사 간 대기/진행(ST01·ST02) 방 1건 (최신순) */
    Optional<ChatRoom> findFirstByUserNoAndLawyerNoAndProgressCodeInOrderByRegDtDesc(
            Long userNo, Long lawyerNo, Collection<String> progressCodes);
}