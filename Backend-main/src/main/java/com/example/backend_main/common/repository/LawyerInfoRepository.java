package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.LawyerInfo;
import com.example.backend_main.dto.LawyerCardDTO;
import com.example.backend_main.dto.LawyerDetailDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LawyerInfoRepository extends JpaRepository<LawyerInfo, Long> {

    @Query("""
        SELECT new com.example.backend_main.dto.LawyerCardDTO(
            l.userNo,
            l.user.userNm,
            l.specialtyStr,
            l.imgUrl,
            COALESCE(AVG(r.rating), 0.0),
            COUNT(r),
            0,
            0
        )
        FROM LawyerInfo l
        LEFT JOIN l.reviews r
        WHERE l.approvalYn = 'Y'
          AND l.user.statusCode = 'S01'
          AND l.user.roleCode = 'ROLE_LAWYER'
        GROUP BY l.userNo, l.user.userNm, l.specialtyStr, l.imgUrl
    """)
    List<LawyerCardDTO> findApprovedCards();

    @Query("""
        SELECT new com.example.backend_main.dto.LawyerDetailDTO(
            l.userNo,
            l.user.userNm,
            l.specialtyStr,
            l.imgUrl,
            l.introText,
            l.officeName,
            l.officeAddr,
            COALESCE(AVG(r.rating), 0.0),
            COUNT(r)
        )
        FROM LawyerInfo l
        LEFT JOIN l.reviews r
        WHERE l.userNo = :userNo
        GROUP BY l.userNo, l.user.userNm, l.specialtyStr, l.imgUrl,
                 l.introText, l.officeName, l.officeAddr
    """)
    LawyerDetailDTO findDetailByUserNo(@Param("userNo") Long userNo);

    boolean existsByLicenseNo(String licenseNo);
}