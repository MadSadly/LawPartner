package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.AdminAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminAuditRepository extends JpaRepository<AdminAudit, Long> {

}