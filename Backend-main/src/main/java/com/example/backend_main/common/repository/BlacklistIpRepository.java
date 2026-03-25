package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.BlacklistIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlacklistIpRepository extends JpaRepository<BlacklistIp, String> {
    // PK가 String(IP)이라서 JpaRepository가 제공하는
    // existsById(), findById(), deleteById()를 그냥 쓰면 됩니다!
    // 커스텀 메서드를 작성할 필요가 싹 사라졌습니다.
}