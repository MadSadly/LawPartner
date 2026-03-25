package com.example.backend_main.dto.HSH_DTO;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
/*
컨버터에서 자동으로 처리 되기 때문에, 굳이 복호화, 암호화 처리할 필요가 없다!
*/
@Getter
@Builder
public class UserListDto {
    private Long userNo;
    private String userId;
    private String userNm;
    private String nickNm;
    private String email;     // 이미 복호화된 평문이 들어갈 자리
    private String phone;     // 이미 복호화된 평문이 들어갈 자리
    private String roleCode;
    private String statusCode;
    private LocalDateTime joinDt;
    private String profileImg;
}