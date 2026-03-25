package com.example.backend_main.ky.service;

import com.example.backend_main.BWJ.BoardReplyRepository;
import com.example.backend_main.ky.dto.LawyerDashboardDTO;
import com.example.backend_main.ky.repository.ConsultationRepository;
import com.example.backend_main.ky.repository.ReviewRepository;
import com.example.backend_main.ky.repository.CalendarRepository;
import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.repository.NotificationRepository;
import com.example.backend_main.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LawyerDashboardService {

    private final ReviewRepository        reviewRepository;
    private final ConsultationRepository  consultationRepository;
    private final CalendarRepository      calendarRepository;
    private final UserRepository          userRepository;
    private final BoardReplyRepository    boardReplyRepository;
    private final NotificationRepository  notificationRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── 후기 목록 ──────────────────────────────────────────────
    public List<LawyerDashboardDTO.ReviewDTO> getReviews(Long lawyerNo) {
        return reviewRepository.findByLawyerNoOrderByRegDtDesc(lawyerNo).stream()
            .map(r -> {
                LawyerDashboardDTO.ReviewDTO dto = new LawyerDashboardDTO.ReviewDTO();
                dto.setReviewNo(r.getReviewNo());
                dto.setStars(r.getStars());
                dto.setContent(r.getContent());
                if (r.getRegDt() != null) dto.setRegDate(r.getRegDt().format(DATE_FMT));
                userRepository.findById(r.getWriterNo())
                    .ifPresent(u -> dto.setWriterNm(u.getUserNm()));
                if (r.getReplyNo() != null) {
                    boardReplyRepository.findById(r.getReplyNo())
                        .ifPresent(reply -> dto.setBoardNo(reply.getBoardNo()));
                }
                return dto;
            }).collect(Collectors.toList());
    }

    // ── 상담(채팅방) 목록 ──────────────────────────────────────
    public List<LawyerDashboardDTO.ConsultationDTO> getConsultations(Long lawyerNo) {
        return consultationRepository.findByLawyerNoOrderByRegDtDesc(lawyerNo).stream()
            .map(c -> {
                LawyerDashboardDTO.ConsultationDTO dto = new LawyerDashboardDTO.ConsultationDTO();
                dto.setRoomId(c.getRoomId());
                dto.setProgressCode(c.getProgressCode());
                dto.setStatusLabel(convertProgress(c.getProgressCode()));
                if (c.getRegDt() != null) dto.setRegDate(c.getRegDt().format(DATE_FMT));
                userRepository.findById(c.getUserNo())
                    .ifPresent(u -> dto.setClientNm(u.getUserNm()));
                dto.setUnreadCount(notificationRepository
                    .countByUserNoAndRoomIdAndReadYn(lawyerNo, c.getRoomId(), "N"));
                return dto;
            }).collect(Collectors.toList());
    }

    // ── 통계 ───────────────────────────────────────────────────
    public LawyerDashboardDTO.StatsDTO getStats(Long lawyerNo) {
        LawyerDashboardDTO.StatsDTO dto = new LawyerDashboardDTO.StatsDTO();
        dto.setSolvedCount(consultationRepository.countByLawyerNoAndProgressCode(lawyerNo, "ST05"));
        dto.setRequestCount(consultationRepository.countByLawyerNo(lawyerNo));
        Double avg = reviewRepository.findAvgRatingByLawyerNo(lawyerNo);
        dto.setAvgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        return dto;
    }

    // ── 일정 조회 ──────────────────────────────────────────────
    public List<LawyerDashboardDTO.CalendarDTO> getCalendars(Long lawyerNo) {
        return calendarRepository.findByLawyerNoOrderByStartDateAsc(lawyerNo).stream()
            .map(e -> {
                LawyerDashboardDTO.CalendarDTO dto = new LawyerDashboardDTO.CalendarDTO();
                dto.setEventNo(e.getEventNo());
                dto.setTitle(e.getTitle());
                dto.setStartDate(e.getStartDate());
                dto.setColorCode(e.getColorCode());
                return dto;
            }).collect(Collectors.toList());
    }

    // ── 일정 추가 ──────────────────────────────────────────────
    public LawyerDashboardDTO.CalendarDTO addCalendar(Long lawyerNo, LawyerDashboardDTO.CalendarRequest req) {
        CalendarEvent saved = calendarRepository.save(
            CalendarEvent.builder()
                .lawyerNo(lawyerNo)
                .userNo(lawyerNo)
                .title(req.getTitle())
                .startDate(req.getStartDate())
                .colorCode(req.getColorCode() != null ? req.getColorCode() : "#3b82f6")
                .build()
        );
        LawyerDashboardDTO.CalendarDTO dto = new LawyerDashboardDTO.CalendarDTO();
        dto.setEventNo(saved.getEventNo());
        dto.setTitle(saved.getTitle());
        dto.setStartDate(saved.getStartDate());
        dto.setColorCode(saved.getColorCode());
        return dto;
    }

    // ── 일정 수정 ──────────────────────────────────────────────
    @org.springframework.transaction.annotation.Transactional
    public void updateCalendar(Long lawyerNo, Long eventNo, String title, String startDate) {
        CalendarEvent event = calendarRepository.findById(eventNo)
            .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));
        if (!lawyerNo.equals(event.getLawyerNo())) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }
        if (title != null && !title.isBlank()) event.setTitle(title);
        if (startDate != null && !startDate.isBlank()) event.setStartDate(startDate);
    }

    // ── 일정 삭제 ──────────────────────────────────────────────
    public void deleteCalendar(Long lawyerNo, Long eventNo) {
        CalendarEvent event = calendarRepository.findById(eventNo)
            .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));
        if (!lawyerNo.equals(event.getLawyerNo())) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }
        calendarRepository.deleteById(eventNo);
    }

    // ── 상담 진행 상태 변경 ────────────────────────────────────
    @org.springframework.transaction.annotation.Transactional
    public void updateConsultationStatus(Long lawyerNo, String roomId, String progressCode) {
        ChatRoom room = consultationRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));
        if (!lawyerNo.equals(room.getLawyerNo())) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }
        room.setProgressCode(progressCode);
    }

    // ── CASE_STEP 코드 → 한글 변환 ───────────────────────────
    private String convertProgress(String code) {
        if (code == null) return "상담 대기";
        switch (code) {
            case "ST01": return "상담 대기";
            case "ST02": return "상담 진행";
            case "ST05": return "상담 종료";
            default:     return "상담 대기";
        }
    }
}