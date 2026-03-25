package com.example.backend_main.HSH.service;

import com.example.backend_main.dto.HSH_DTO.CreateOperatorRequestDto;
import com.example.backend_main.common.entity.LawyerInfo;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.repository.AdminAuditRepository;
import com.example.backend_main.common.repository.BannedWordRepository;
import com.example.backend_main.common.repository.BlacklistIpRepository;
import com.example.backend_main.common.repository.LawyerInfoRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.common.util.PasswordUtil;
import com.example.backend_main.dto.Board;
import com.example.backend_main.BWJ.BoardRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AccessLogRepository accessLogRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private HashUtil hashUtil;
    @Mock
    private BlacklistIpRepository blacklistIpRepository;
    @Mock
    private LawyerInfoRepository lawyerInfoRepository;
    @Mock
    private BannedWordRepository bannedWordRepository;
    @Mock
    private BoardRepository boardRepository;
    @Mock
    private AdminAuditRepository adminAuditRepository;
    @Mock
    private MailService mailService;

    @InjectMocks
    private AdminService adminService;

    @Test
    void updateUserStatus_변호사승인_roleCode변경및approve호출() {
        User targetUser = User.builder()
                .userNo(100L)
                .userId("targetUser")
                .userPw("pw")
                .userNm("대상")
                .nickNm("n")
                .email("t@t.com")
                .emailHash("eh")
                .phone("010")
                .phoneHash("ph")
                .roleCode("ROLE_ASSOCIATE")
                .statusCode("S02")
                .build();

        User adminUser = User.builder()
                .userNo(1L)
                .userId("admin1")
                .userPw("pw")
                .userNm("관리자")
                .email("a@a.com")
                .emailHash("ah")
                .phone("010")
                .phoneHash("aph")
                .roleCode("ROLE_ADMIN")
                .statusCode("S01")
                .build();

        when(userRepository.findByUserId("targetUser")).thenReturn(Optional.of(targetUser));
        when(userRepository.findByUserId("admin1")).thenReturn(Optional.of(adminUser));

        LawyerInfo mockLawyerInfo = mock(LawyerInfo.class);
        when(lawyerInfoRepository.findById(100L)).thenReturn(Optional.of(mockLawyerInfo));

        adminService.updateUserStatus("targetUser", "S01", "승인", "admin1");

        assertThat(targetUser.getRoleCode()).isEqualTo("ROLE_LAWYER");
        verify(mockLawyerInfo).approve();
        verify(adminAuditRepository).save(any());
    }

    @Test
    void updateUserStatus_계정정지해제_정상처리() {
        User targetUser = User.builder()
                .userNo(200L)
                .userId("targetUser")
                .userPw("pw")
                .userNm("대상")
                .email("t@t.com")
                .emailHash("eh")
                .phone("010")
                .phoneHash("ph")
                .roleCode("ROLE_USER")
                .statusCode("S03")
                .build();

        User adminUser = User.builder()
                .userNo(1L)
                .userId("admin1")
                .userPw("pw")
                .userNm("관리자")
                .email("a@a.com")
                .emailHash("ah")
                .phone("010")
                .phoneHash("aph")
                .roleCode("ROLE_ADMIN")
                .statusCode("S01")
                .build();

        when(userRepository.findByUserId("targetUser")).thenReturn(Optional.of(targetUser));
        when(userRepository.findByUserId("admin1")).thenReturn(Optional.of(adminUser));

        adminService.updateUserStatus("targetUser", "S01", "해제", "admin1");

        assertThat(targetUser.getStatusCode()).isEqualTo("S01");
        verify(adminAuditRepository).save(any());
    }

    @Test
    void updateUserStatus_슈퍼관리자정지시도_ACCESS_DENIED() {
        User targetUser = User.builder()
                .userNo(300L)
                .userId("targetUser")
                .userPw("pw")
                .userNm("슈퍼")
                .email("t@t.com")
                .emailHash("eh")
                .phone("010")
                .phoneHash("ph")
                .roleCode("ROLE_SUPER_ADMIN")
                .statusCode("S01")
                .build();

        User adminUser = User.builder()
                .userNo(1L)
                .userId("admin1")
                .userPw("pw")
                .userNm("관리자")
                .email("a@a.com")
                .emailHash("ah")
                .phone("010")
                .phoneHash("aph")
                .roleCode("ROLE_ADMIN")
                .statusCode("S01")
                .build();

        when(userRepository.findByUserId("targetUser")).thenReturn(Optional.of(targetUser));
        when(userRepository.findByUserId("admin1")).thenReturn(Optional.of(adminUser));

        CustomException ex = assertThrows(
                CustomException.class,
                () -> adminService.updateUserStatus("targetUser", "S03", "정지", "admin1"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    void updateUserStatus_대상유저없음_DATA_NOT_FOUND() {
        when(userRepository.findByUserId("notExist")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(
                CustomException.class,
                () -> adminService.updateUserStatus("notExist", "S01", "x", "admin1"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.DATA_NOT_FOUND);
    }

    @Test
    void createSubAdmin_권한없음_ACCESS_DENIED() {
        CreateOperatorRequestDto dto = CreateOperatorRequestDto.builder()
                .userId("op1")
                .userNm("nm")
                .email("op@test.com")
                .phone("010-1234-5678")
                .reason("reason")
                .build();

        User requester = User.builder()
                .userNo(1L)
                .userId("admin1")
                .userPw("pw")
                .userNm("관리자")
                .email("a@a.com")
                .emailHash("ah")
                .phone("010")
                .phoneHash("aph")
                .roleCode("ROLE_ADMIN")
                .statusCode("S01")
                .build();

        when(userRepository.findByUserId("admin1")).thenReturn(Optional.of(requester));

        CustomException ex = assertThrows(CustomException.class, () -> adminService.createSubAdmin(dto, "admin1"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    void createSubAdmin_아이디중복_DUPLICATE_DATA() {
        CreateOperatorRequestDto dto = CreateOperatorRequestDto.builder()
                .userId("dupId")
                .userNm("nm")
                .email("op@test.com")
                .phone("010-1234-5678")
                .reason("reason")
                .build();

        User superAdmin = User.builder()
                .userNo(1L)
                .userId("admin1")
                .userPw("pw")
                .userNm("슈퍼")
                .email("a@a.com")
                .emailHash("ah")
                .phone("010")
                .phoneHash("aph")
                .roleCode("ROLE_SUPER_ADMIN")
                .statusCode("S01")
                .build();

        when(userRepository.findByUserId("admin1")).thenReturn(Optional.of(superAdmin));
        when(userRepository.existsByUserId("dupId")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> adminService.createSubAdmin(dto, "admin1"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_DATA);
    }

    @Test
    void createSubAdmin_정상생성_save및메일발송확인() {
        CreateOperatorRequestDto dto = CreateOperatorRequestDto.builder()
                .userId("newOp")
                .userNm("nm")
                .email("new@test.com")
                .phone("010-9999-8888")
                .reason("reason")
                .build();

        User superAdmin = User.builder()
                .userNo(1L)
                .userId("admin1")
                .userPw("pw")
                .userNm("슈퍼")
                .email("a@a.com")
                .emailHash("ah")
                .phone("010")
                .phoneHash("aph")
                .roleCode("ROLE_SUPER_ADMIN")
                .statusCode("S01")
                .build();

        when(userRepository.findByUserId("admin1")).thenReturn(Optional.of(superAdmin));
        when(userRepository.existsByUserId("newOp")).thenReturn(false);
        when(hashUtil.generateHash(eq("new@test.com"))).thenReturn("emailHash");
        when(hashUtil.generateHash(eq("010-9999-8888"))).thenReturn("phoneHash");
        when(passwordEncoder.encode(eq("fixedTempPw"))).thenReturn("ENCODED");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserNo(99L);
            return u;
        });

        try (MockedStatic<PasswordUtil> pwd = mockStatic(PasswordUtil.class)) {
            pwd.when(PasswordUtil::generateTempPassword).thenReturn("fixedTempPw");
            adminService.createSubAdmin(dto, "admin1");
        }

        verify(userRepository).save(any(User.class));
        verify(userRepository).updatePwChangeRequiredToY(eq(99L));
        verify(mailService).sendTempPasswordMail(eq("new@test.com"), eq("fixedTempPw"));
    }

    @Test
    void toggleBoardBlind_blindYn_N에서_Y로반전() {
        Board board = Board.builder()
                .boardNo(1L)
                .blindYn("N")
                .build();

        when(boardRepository.findById(1L)).thenReturn(Optional.of(board));

        adminService.toggleBoardBlind(1L, "블라인드", "admin1");

        assertThat(board.getBlindYn()).isEqualTo("Y");
    }

    @Test
    void toggleBoardBlind_게시글없음_DATA_NOT_FOUND() {
        when(boardRepository.findById(1L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(
                CustomException.class,
                () -> adminService.toggleBoardBlind(1L, "x", "admin1"));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.DATA_NOT_FOUND);
    }
}
