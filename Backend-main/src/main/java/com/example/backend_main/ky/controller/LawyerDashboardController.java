package com.example.backend_main.ky.controller;

import com.example.backend_main.ky.dto.LawyerDashboardDTO;
import com.example.backend_main.ky.service.LawyerDashboardService;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lawyer/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://192.168.0.43:3000", "http://localhost:3000"})
public class LawyerDashboardController {

    private final LawyerDashboardService dashboardService;
    private final JwtTokenProvider       jwtTokenProvider;

    // ── 후기 목록 ──────────────────────────────────────────────
    @GetMapping("/reviews")
    public ResultVO<List<LawyerDashboardDTO.ReviewDTO>> getReviews(
            @RequestHeader("Authorization") String token) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        return ResultVO.ok("후기 목록 조회 성공", dashboardService.getReviews(userNo));
    }

    @GetMapping("/consultations")
    public ResultVO<List<LawyerDashboardDTO.ConsultationDTO>> getConsultations(
            @RequestHeader("Authorization") String token) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        return ResultVO.ok("상담 목록 조회 성공", dashboardService.getConsultations(userNo));
    }

    @GetMapping("/stats")
    public ResultVO<LawyerDashboardDTO.StatsDTO> getStats(
            @RequestHeader("Authorization") String token) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        return ResultVO.ok("통계 조회 성공", dashboardService.getStats(userNo));
    }

    @GetMapping("/calendars")
    public ResultVO<List<LawyerDashboardDTO.CalendarDTO>> getCalendars(
            @RequestHeader("Authorization") String token) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        return ResultVO.ok("일정 조회 성공", dashboardService.getCalendars(userNo));
    }

    @PostMapping("/calendars")
    public ResultVO<LawyerDashboardDTO.CalendarDTO> addCalendar(
            @RequestHeader("Authorization") String token,
            @RequestBody LawyerDashboardDTO.CalendarRequest req) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        return ResultVO.ok("일정 추가 성공", dashboardService.addCalendar(userNo, req));
    }

    @PatchMapping("/calendars/{eventNo}")
    public ResultVO<Void> updateCalendar(
            @RequestHeader("Authorization") String token,
            @PathVariable Long eventNo,
            @RequestBody java.util.Map<String, String> body) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        dashboardService.updateCalendar(userNo, eventNo, body.get("title"), body.get("startDate"));
        return ResultVO.ok("일정 수정 성공", null);
    }

    @DeleteMapping("/calendars/{eventNo}")
    public ResultVO<Void> deleteCalendar(
            @RequestHeader("Authorization") String token,
            @PathVariable Long eventNo) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        dashboardService.deleteCalendar(userNo, eventNo);
        return ResultVO.ok("일정 삭제 성공", null);
    }

    @PatchMapping("/consultations/{roomId}/status")
    public ResultVO<Void> updateConsultationStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable String roomId,
            @RequestBody java.util.Map<String, String> body) {
        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        dashboardService.updateConsultationStatus(userNo, roomId, body.get("progressCode"));
        return ResultVO.ok("상태 변경 성공", null);
    }

    private Long extractUserNo(String token) {
        return jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
    }
}
