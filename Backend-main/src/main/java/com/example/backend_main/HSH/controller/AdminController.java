package com.example.backend_main.HSH.controller;

import com.example.backend_main.dto.HSH_DTO.CreateOperatorRequestDto;
import com.example.backend_main.HSH.service.AdminService;
import com.example.backend_main.HSH.service.InquiryService;
import com.example.backend_main.HSH.service.LawyerService;
import com.example.backend_main.common.annotation.ActionLog;
import com.example.backend_main.common.entity.BannedWord;
import com.example.backend_main.common.entity.BlacklistIp;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.*;
import com.example.backend_main.dto.HSH_DTO.AccessLogResponseDTO;
import com.example.backend_main.dto.HSH_DTO.BannedWordDto;
import com.example.backend_main.dto.HSH_DTO.InquiryDto;
import com.example.backend_main.dto.HSH_DTO.UserListDto;
import com.example.backend_main.dto.HSH_DTO.UserRoleUpdateDto;
import com.example.backend_main.dto.HSH_DTO.UserStatusUpdateDto;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;
import java.util.Map;

/*
 * [AdminController]
 * - 모든 예외는 GlobalExceptionHandler가 처리 → 컨트롤러에 try-catch 없음
 * - Security 필터가 인증을 보장 → null 체크 없음
 * - 컨트롤러 역할: 요청 받기 → @Valid 형식 검증 → 서비스 호출 → 응답 반환
 * - 응답 타입: ResultVO 로 통일 (ResponseEntity 혼용 제거)
 * - Repository 직접 호출 없음 → 모든 데이터 접근은 AdminService 경유
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminService adminService;
    private final InquiryService inquiryService;
    private final LawyerService lawyerService;

    // ==================================================================================
    // 👤 회원 관리
    // ==================================================================================

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN','OPERATOR')")
    public ResultVO<List<UserListDto>> getAllUsers() {
        return ResultVO.ok("전체 회원 목록을 성공적으로 불러왔습니다.", adminService.getAllUsers());
    }

    @PutMapping("/user/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @ActionLog(action = "UPDATE_USER_STATUS", target = "TB_USER")
    public ResultVO<Void> updateUserStatus(
            @Valid @RequestBody UserStatusUpdateDto dto,
            Principal principal) {
        adminService.updateUserStatus(dto.getUserId(), dto.getStatusCode(), dto.getReason(), principal.getName());
        return ResultVO.ok("회원 상태가 성공적으로 변경되었습니다.", null);
    }

    @PutMapping("/user/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @ActionLog(action = "UPDATE_USER_ROLE", target = "TB_USER")
    public ResultVO<Void> updateUserRole(
            @Valid @RequestBody UserRoleUpdateDto dto,
            Principal principal) {
        adminService.updateUserRole(dto.getUserId(), dto.getRoleCode(), dto.getReason(), principal.getName());
        return ResultVO.ok("회원 권한이 성공적으로 변경되었습니다.", null);
    }

    @PostMapping("/create-operator")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @ActionLog(action = "CREATE_OPERATOR", target = "TB_USER")
    public ResultVO<String> createOperator(
            @Valid @RequestBody CreateOperatorRequestDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        adminService.createSubAdmin(dto, userDetails.getUserId());
        return ResultVO.ok("하위 관리자(운영자)가 성공적으로 생성되었습니다.", null);
    }

    @GetMapping("/lawyers/{userNo}/license")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @ActionLog(action = "DOWNLOAD_LAWYER_LICENSE", target = "TB_LAWYER_INFO")
    public ResponseEntity<Resource> downloadLawyerLicense(@PathVariable Long userNo) {
        Resource resource = lawyerService.loadLicenseFile(userNo);
        String filename = resource.getFilename();

        String mimeType = lawyerService.detectLicenseMimeType(userNo);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (mimeType != null) {
            try {
                mediaType = MediaType.parseMediaType(mimeType);
            } catch (IllegalArgumentException ignored) {
                // fallback to OCTET_STREAM
            }
        }

        ContentDisposition contentDisposition = ContentDisposition.builder("inline")
                .filename(filename, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
    }

    // ==================================================================================
    // 📋 로그 관리
    // ==================================================================================

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR')")
    public ResultVO<Page<AccessLogResponseDTO>> getAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String keywordType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String statusType) {
        return ResultVO.ok("로그 조회 성공",
                adminService.searchAccessLogs(page, size, startDate, endDate, keywordType, keyword, statusType));
    }

    @GetMapping("/logs/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR')")
    @ActionLog(action = "DOWNLOAD_EXCEL", target = "TB_ACCESS_LOG")
    public void downloadLogs(
            HttpServletResponse response,
            @RequestParam String reason) throws IOException {
        adminService.downloadAccessLogExcel(response);
    }

    @GetMapping("/logs/threats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR')")
    public ResultVO<List<AccessLogResponseDTO>> getRecentThreats() {
        return ResultVO.ok("최신 보안 위협 로그를 성공적으로 불러왔습니다.", adminService.getRecentThreats());
    }

    // ==================================================================================
    // 📊 대시보드 통계
    // ==================================================================================

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR')")
    public ResultVO<Map<String, Object>> getAdminSummary() {
        return ResultVO.ok("요약 데이터를 성공적으로 불러왔습니다.", adminService.getAdminSummary());
    }

    @GetMapping("/status/daily")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR')")
    public ResultVO<List<Map<String, Object>>> getDailyStats(
            @RequestParam(defaultValue = "7") int days) {
        return ResultVO.ok("통계 데이터를 성공적으로 불러왔습니다.", adminService.getDailyVisitStats(days));
    }

    // ==================================================================================
    // 🚨 IP 블랙리스트 관리
    // ==================================================================================

    @GetMapping("/blacklist")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR')")
    public ResultVO<List<BlacklistIp>> getBlacklist() {
        return ResultVO.ok(adminService.getAllBlacklist());
    }

    @PostMapping("/blacklist")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @ActionLog(action = "IP 블랙리스트 추가", target = "보안 시스템")
    public ResultVO<Void> addBlacklist(
            @RequestBody Map<String, String> payload,
            Principal principal) {
        adminService.addBlacklist(payload.get("ip"), payload.get("reason"), principal.getName());
        return ResultVO.ok("IP가 차단되었습니다.", null);
    }

    @DeleteMapping("/blacklist")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @ActionLog(action = "IP 블랙리스트 해제", target = "보안 시스템")
    public ResultVO<Void> removeBlacklist(
            @RequestParam String ip,
            @RequestParam String reason) {
        // ✅ PathVariable → RequestParam 변경 (IP의 점(.)을 확장자로 인식하는 파싱 문제 해결)
        adminService.removeBlacklist(ip, reason);
        return ResultVO.ok("IP 차단이 해제되었습니다.", null);
    }

    // ==================================================================================
    // 🔤 금지어 관리
    // ==================================================================================

    @PostMapping("/banned-words")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @ActionLog(action = "ADD_BANNED_WORD", target = "TB_BANNED_WORD")
    public ResultVO<Void> addBannedWord(
            @Valid @RequestBody BannedWordDto dto,
            Principal principal) {
        adminService.addBannedWord(dto.getWord(), dto.getReason(), principal.getName());
        return ResultVO.ok("금지어가 등록되었습니다.", null);
    }

    @DeleteMapping("/banned-words/{wordNo}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @ActionLog(action = "DELETE_BANNED_WORD", target = "TB_BANNED_WORD")
    public ResultVO<Void> deleteBannedWord(@PathVariable Long wordNo) {
        adminService.deleteBannedWord(wordNo);
        return ResultVO.ok("금지어가 삭제되었습니다.", null);
    }

    @GetMapping("/banned-words")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR')")
    public ResultVO<List<BannedWord>> getBannedWords() {
        return ResultVO.ok("금지어 목록을 불러왔습니다.", adminService.getAllBannedWords());
    }

    // ==================================================================================
    // 📝 게시글 관리
    // ==================================================================================

    @GetMapping("/boards")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR')")
    public ResultVO<List<Board>> getAllBoards() {
        return ResultVO.ok(adminService.getAllBoards());
    }

    @PutMapping("/board/blind")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR')")
    @ActionLog(action = "TOGGLE_BLIND", target = "TB_BOARD")
    public ResultVO<Void> toggleBoardBlind(
            @Valid @RequestBody BoardBlindDto dto,
            Principal principal) {
        adminService.toggleBoardBlind(dto.getBoardNo(), dto.getReason(), principal.getName());
        return ResultVO.ok("게시글 상태가 변경되었습니다.", null);
    }

    // ==================================================================================
    // 💬 문의 관리 (수정 완료)
    // ==================================================================================

    // 전체 문의 목록 조회
    @GetMapping("/customer/inquiries")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR')")
    public ResultVO<List<InquiryDto.ListResponse>> getAllInquiries(
            @RequestParam(required = false) String status) {
        // ✅ 2. adminService 대신 inquiryService의 성능 최적화된 메서드 호출
        return ResultVO.ok("문의 목록을 성공적으로 불러왔습니다.", inquiryService.getAllInquiries(status));
    }

    // 문의 상세 조회
    @GetMapping("/customer/inquiries/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR')")
    public ResultVO<InquiryDto.DetailResponse> getInquiryDetail(@PathVariable Long id) {
        // ✅ 3. 작성자 실명/ID가 포함된 상세 정보를 가져옴
        return ResultVO.ok("문의 상세를 성공적으로 불러왔습니다.", inquiryService.getInquiryDetail(id));
    }

    // 관리자 답변 저장
    @PutMapping("/customer/inquiries/{id}/answer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR')")
    @ActionLog(action = "SAVE_INQUIRY_ANSWER", target = "TB_CUSTOMER_INQUIRY")
    public ResultVO<Void> saveAnswer(
            @PathVariable Long id,
            @Valid @RequestBody InquiryDto.AnswerRequest dto) { // ✅ JSON 데이터를 DTO로 자동 매핑
        // ✅ 4. 서비스 레이어에서 답변 저장 및 상태 변경 처리
        inquiryService.saveAnswer(id, dto);
        return ResultVO.ok("답변이 저장되었습니다.", null);
    }

    // 문의 삭제
    @DeleteMapping("/customer/inquiries/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @ActionLog(action = "DELETE_INQUIRY", target = "TB_CUSTOMER_INQUIRY")
    public ResultVO<Void> deleteInquiry(@PathVariable Long id) {
        // ✅ 5. 삭제 권한 체크 후 처리
        inquiryService.deleteInquiry(id);
        return ResultVO.ok("문의가 삭제되었습니다.", null);
    }
}