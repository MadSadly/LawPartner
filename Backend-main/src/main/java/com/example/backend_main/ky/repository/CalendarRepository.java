package com.example.backend_main.ky.repository;

import com.example.backend_main.common.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalendarRepository extends JpaRepository<CalendarEvent, Long> {

    // 특정 변호사의 일정 목록 (날짜 오름차순)
    List<CalendarEvent> findByLawyerNoOrderByStartDateAsc(Long lawyerNo);
}
