package com.example.backend_main.dto.HSH_DTO;

import com.example.backend_main.common.entity.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponseDto {
    private Long userNo;
    private String userId;
    private String userNm;
    private String phone; // 복호화된 원본 번호가 일단 이쪽으로 들어옵니다.

    // Entity -> DTO 변환 편의 메서드
    public static UserResponseDto from(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setUserNo(user.getUserNo());
        dto.setUserId(user.getUserId());
        dto.setUserNm(user.getUserNm());
        dto.setPhone(user.getPhone()); // AES-256 복호화된 "010-1234-5678"
        return dto;
    }
}