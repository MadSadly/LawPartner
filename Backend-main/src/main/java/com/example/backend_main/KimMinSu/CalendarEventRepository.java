package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByUserNoAndStartDateBetween(Long userNo, String start, String end);
    List<CalendarEvent> findByUserNoAndStartDateStartingWith(Long userNo, String yearMonthPrefix);
}