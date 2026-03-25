package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    // 유저 번호로 기존 토큰이 있는지 찾는 기능
    Optional<RefreshToken> findByUserNo(Long userNo);

    Optional<RefreshToken> findByTokenValue(String tokenValue);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.userNo = :userNo")
    void deleteByUserNo(@Param("userNo") Long userNo);

}