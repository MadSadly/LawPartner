package com.example.backend_main.ky.repository;

import com.example.backend_main.ky.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    // 같은 paymentId로 중복 결제 처리 방지
    boolean existsByPaymentId(String paymentId);

    // 구독 여부 확인
    boolean existsByUser_UserNo(Long userNo);

    // 결제 내역 조회 (최신순)
    List<Subscription> findByUser_UserNoOrderBySubDtDesc(Long userNo);

    // 가장 최근 구독 1건 조회 (다음 결제일 계산용)
    Optional<Subscription> findTopByUser_UserNoOrderBySubDtDesc(Long userNo);

    // 구독 취소 시 삭제
    void deleteByUser_UserNo(Long userNo);
}