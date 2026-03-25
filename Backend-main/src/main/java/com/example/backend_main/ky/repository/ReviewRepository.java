package com.example.backend_main.ky.repository;

import com.example.backend_main.ky.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 특정 변호사의 후기 목록 (최신순)
    List<Review> findByLawyerNoOrderByRegDtDesc(Long lawyerNo);

    // 특정 변호사의 후기 개수
    long countByLawyerNo(Long lawyerNo);

    // 의뢰인(작성자) 기준 내가 쓴 리뷰 목록 (일반 마이페이지용)
    List<Review> findByWriterNoOrderByRegDtDesc(Long writerNo);

    // 특정 변호사의 평균 별점 (stats 용)
    @Query("SELECT AVG(r.stars) FROM Review r WHERE r.lawyerNo = :lawyerNo")
    Double findAvgRatingByLawyerNo(@Param("lawyerNo") Long lawyerNo);
}
