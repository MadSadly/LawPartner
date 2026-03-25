package com.example.backend_main.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LawyerCardDTO {

    private Long userNo;
    private String userNm;
    private String specialtyStr;
    private String imgUrl;

    private Double rating;       // AVG 결과
    private Long reviewCount;    // COUNT 결과

    private Integer careerYears; // DDL에 없음 → 0
    private Integer responseRate; // DDL에 없음 → 0
}