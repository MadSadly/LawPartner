package com.example.backend_main.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CalendarEventDTO {
    // [초심자 핵심] 프론트 달력 라이브러리가 무조건 이 3개 이름으로 데이터를 요구함
    private String title;  // 일정 제목 (누구누구 변호사 면담)
    private String start;  // 일정 날짜 (2026-03-10T14:00)
    private String color;  // 라벨 색상 (#3b82f6)
}