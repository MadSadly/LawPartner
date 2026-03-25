package com.example.backend_main.dto.HSH_DTO;

import com.example.backend_main.common.entity.AccessLog;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AccessLogResponseDTO {

    private Long logNo;
    private String traceId;
    private String reqIp;
    private String reqUri;
    private String userAgent;
    private Long userNo;
    private Integer statusCode;
    private Long execTime;
    private String errorMsg;
    private LocalDateTime regDt;

    // Entity를 받아서 DTO로 변환하는 [정적 팩토리 메서드]
    // 이렇게 하면 Service나 Controller에서 변환 코드가 아주 깔끔
    public static AccessLogResponseDTO fromEntity(AccessLog entity) {
        return AccessLogResponseDTO.builder()
                .logNo(entity.getLogNo())
                .traceId(entity.getTraceId())
                .reqIp(entity.getReqIp())
                .reqUri(entity.getReqUri())
                .userAgent(entity.getUserAgent())
                .userNo(entity.getUserNo())
                .statusCode(entity.getStatusCode())
                .execTime(entity.getExecTime())
                .errorMsg(entity.getErrorMsg())
                .regDt(entity.getRegDt())
                .build();
    }
}