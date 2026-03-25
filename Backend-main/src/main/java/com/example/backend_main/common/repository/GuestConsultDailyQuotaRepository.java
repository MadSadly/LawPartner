package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.GuestConsultDailyQuota;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface GuestConsultDailyQuotaRepository extends JpaRepository<GuestConsultDailyQuota, Long> {

    Optional<GuestConsultDailyQuota> findByClientIpAndQuotaDate(String clientIp, LocalDate quotaDate);
}
