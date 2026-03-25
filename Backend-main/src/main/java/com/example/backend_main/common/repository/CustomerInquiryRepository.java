package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.CustomerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/*
 [CustomerInquiryRepository]
 - 관리자용: 전체 문의 조회 (상태별 필터링)
 - 사용자용: 내 문의 목록 조회
 - 기본 CRUD (findById, save, delete)는 JpaRepository가 제공
*/
public interface CustomerInquiryRepository extends JpaRepository<CustomerInquiry, Long> {

    /*
     [관리자용] 전체 문의 최신순 조회
     [도입 원인]: N+1 문제를 방지하기 위해 JOIN FETCH로 User 정보를 한 번에 가져옴
     [기대 결과]: 단 한 번의 쿼리로 모든 문의와 작성자 정보를 조회하여 성능 극대화
    */
    @Query("SELECT i FROM CustomerInquiry i JOIN FETCH i.writer ORDER BY i.createdAt DESC")
    List<CustomerInquiry> findAllWithUser();

    /*
     [관리자용] 상태별 필터링 조회
    */
    @Query("SELECT i FROM CustomerInquiry i JOIN FETCH i.writer WHERE i.status = :status ORDER BY i.createdAt DESC")
    List<CustomerInquiry> findByStatusWithUser(@Param("status") String status);

    // 사용자용 — 내 문의 목록 최신순 조회 (엔티티 필드는 writer 뿐이므로 writer.userNo 경로 사용)
    List<CustomerInquiry> findByWriter_UserNoOrderByCreatedAtDesc(Long userNo);
}