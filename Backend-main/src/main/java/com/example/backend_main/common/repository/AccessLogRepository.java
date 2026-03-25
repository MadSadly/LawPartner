package com.example.backend_main.common.repository;


import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


/*
[AccessLogRepository]
보안 로그 데이터를 DB에 저장하기 위한 레포지토리!
*/
@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long>, JpaSpecificationExecutor<AccessLog>{

    // 상태 코드가 특정 값(예: 400) 이상인 최신 로그 5개만 조회
    List<AccessLog> findTop5ByStatusCodeGreaterThanEqualOrderByRegDtDesc(Integer statusCode);

    // 상태 코드 필터링 조회
    Page<AccessLog> findByStatusCodeGreaterThanEqual(Integer statusCode, Pageable pageable);

    // [신규] 지정일별 방문자 수 (API 호출 수)
    @Query(value = "SELECT TO_CHAR(REG_DT, 'YYYY-MM-DD') as \"date\", COUNT(DISTINCT REQ_IP) as \"count\" " +
            "FROM TB_ACCESS_LOG " +
            "WHERE REG_DT >= :sevenDaysAgo " +
            "GROUP BY TO_CHAR(REG_DT, 'YYYY-MM-DD')", nativeQuery = true)
    List<Map<String, Object>> findDailyVisitorStats(@Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);

    // ==================================================================================
    // 📊 대시보드 통계용 쿼리 (성능 최적화)
    // ==================================================================================

    // 1. 기간별 순수 방문자 수 (IP 중복 제거)
    @Query("SELECT COUNT(DISTINCT a.reqIp) FROM AccessLog a WHERE a.regDt BETWEEN :start AND :end")
    long countDistinctIpByRegDtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // 2. 기간별 보안 위협 수 (Status >= 400)
    @Query("SELECT COUNT(a) FROM AccessLog a WHERE a.statusCode >= 400 AND a.regDt BETWEEN :start AND :end")
    long countThreatsByRegDtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}