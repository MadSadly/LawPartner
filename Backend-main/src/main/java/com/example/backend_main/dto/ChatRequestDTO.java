package com.example.backend_main.dto;

import lombok.*;

@Getter
@Setter
public class ChatRequestDTO {
    private Long lawyerNo; // 상담을 요청할 변호사의 고유 번호
    private Long userNo;
}


