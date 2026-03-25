package com.example.backend_main.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LawyerDetailDTO {
    private Long userNo;
    private String userNm;
    private String specialtyStr;
    private String imgUrl;
    private String introText;
    private String officeName;
    private String officeAddr;
    private double rating;
    private long reviewCount;
}