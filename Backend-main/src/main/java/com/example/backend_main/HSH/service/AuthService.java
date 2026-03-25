package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.RefreshToken;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.RefreshTokenRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.HSH_DTO.TokenDTO;
import com.example.backend_main.dto.HSH_DTO.UserJoinRequestDto;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

/*
이 클래스는 시스템에 들어오려는 사람들의 서류를 검사 및 통행증 발급해주는 사령부!
@RequiredArgsConstructor : 필요한 도구들(final)을 스프링이 자동으로 배치해도록 해주는 어노테이션
@Transactional(readOnly = true) : 기본적으로는 읽기 전용 모드로 안전하게 운영하기..! + 원자성!

*/
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AuthService {
    // 미리 준비한 3가지 핵심 도구를 의존성 설정!
    private final UserRepository userRepository;        // DB 창고 관리자
    private final Aes256Util aes256Util;                // PII 전용 암호기
    private final JwtTokenProvider jwtTokenProvider;    // 신분증(토큰) 발급기
    private final PasswordEncoder passwordEncoder;      // 비밀번호 전용 보초
    private final LawyerService lawyerService;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final HashUtil hashUtil;                    // 단방향 해시 처리 (검색용)


    /*
 [회원가입] USR-01 요구사항 반영
 비밀번호는 BCrypt로, 이메일/폰은 AES-256으로 암호화하여 저장합니다.
 */
    @Transactional
    public void join(UserJoinRequestDto dto) {
        // 1. 왜? 'throws Exception'이 사라짐으로써 메서드가 가벼워졌습니다.
        log.info("📝 [회원가입 시작] ID: {}", dto.getUserId());

        // 1-1. 아이디 중복 체크
        if (userRepository.existsByUserId(dto.getUserId())) {
            throw new CustomException(ErrorCode.DUPLICATE_USER_ID);
        }

        // 1-2. 이메일/폰 중복 체크 (해시값 기준)
        String inputEmailHash = hashUtil.generateHash(dto.getEmail());
        String inputPhoneHash = hashUtil.generateHash(dto.getPhone());

        if (userRepository.existsByEmailHash(inputEmailHash)) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (userRepository.existsByPhoneHash(inputPhoneHash)) {
            throw new CustomException(ErrorCode.DUPLICATE_PHONE);
        }

        // 1-3 닉네임 중복 체크 및 결정
        String finalNickname = determineNickname(dto);
        if (userRepository.existsByNickNm(finalNickname)) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "이미 사용 중인 닉네임입니다.");
        }

        // 2. 비밀번호 해싱 (BCrypt는 단방향이라 컨버터 대신 여기서 처리하는 게 맞습니다)
        String hashedPw = passwordEncoder.encode(dto.getUserPw());

        // ⚠️ aes256Util.encrypt() 하던 try-catch 블록은 통째로 삭제했습니다!

        // 3. 권한 및 상태 결정 로직
        String initialRole = dto.getRoleCode();
        String initialStatus = "S01";

        if ("ROLE_LAWYER".equals(dto.getRoleCode())) {
            initialRole = "ROLE_ASSOCIATE";
            initialStatus = "S02";
        }

        // 4. Entity 생성 및 저장
        User user = User.builder()
                .userId(dto.getUserId())
                .userPw(hashedPw)
                .userNm(dto.getUserNm())
                .nickNm(finalNickname)
                .email(dto.getEmail())         // 🔑 평문 그대로 삽입! (엔티티의 컨버터가 알아서 암호화함)
                .emailHash(inputEmailHash)
                .phone(dto.getPhone())         // 🔑 평문 그대로 삽입! (엔티티의 컨버터가 알아서 암호화함)
                .phoneHash(inputPhoneHash)
                .roleCode(initialRole)
                .statusCode(initialStatus)
                .build();

        userRepository.save(user); // Insert 쿼리가 날아갈 때 자동으로 암호화됩니다

        // 5. 후속 처리
        if (user.isLawyer()) {
            log.info("⚖️ [변호사 회원가입] 상세 정보 등록 시작: {}", user.getUserId());
            lawyerService.registerLawyerInfo(user, dto);
        }

        log.info("✅ [회원가입 완료] 유저 No: {}", user.getUserNo());
    }

    /*
     [로그인] AUTH-01 & SEC-01 요구사항 반영
     아이디/비번을 검증하고 Access/Refresh Token을 발급합니다.
     */
    @Transactional
    public TokenDTO login(String userId, String password) {

        // 1. 유저 찾기 및 비번 대조 (ErrorCode.INVALID_INPUT 또는 별도 LOGIN_FAIL 사용)
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(password, user.getUserPw())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD, "아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        // 2. 상태 검사 (ErrorCode.ACCESS_DENIED 또는 ILLEGAL_STATE)
        if ("S03".equals(user.getStatusCode())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "이용이 정지된 계정입니다.");
        }


        // 4. 토큰 생성
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getEmail(), // 🔑 그냥 getEmail()을 부르면 JPA가 알아서 복호화된 평문을 줍니다!
                null,
                List.of(new SimpleGrantedAuthority(user.getRoleCode()))
        );

        // 5. 토큰 만들기
        TokenDTO tokenDTO = jwtTokenProvider.createToken(
                authentication, user.getUserNo(), user.getUserNm(), user.getNickNm()
        );

        // 임시 비밀번호 사용 여부를 프론트에 전달
        tokenDTO.setPasswordChangeRequired("Y".equalsIgnoreCase(user.getPwChangeRequired()));

        // 6. ✅ RefreshToken DB 저장 (토큰 재발급 검증용)
        refreshTokenService.saveRefreshToken(user.getUserNo(), tokenDTO.getRefreshToken());

        return tokenDTO;
    }

    // =================================================================================
    // [내부 헬퍼 메서드] 닉네임 결정 로직
    // =================================================================================
    private String determineNickname(UserJoinRequestDto dto) {
        // user의 isLawyer()을 못 쓰는 이유 : 분기가 다르기 때문에.
        // dto.isLawyer() : join - 새로 만들기 때문에, 만들 dto에서 처리하는 것이 분기에 적합.
        // user.isLawyer() : login - 이미 존재하는 계정이기 때문에 user의 엔티티 사용
        if (dto.isLawyer()) {
            String baseName = dto.getUserNm();
            if (!userRepository.existsByNickNm(baseName)) {
                return baseName;
            }
            int count = userRepository.countByNickNmStartingWith(baseName);
            return baseName + "_" + (count + 1);
        } else {
            // [일반 유저] 닉네임 = 입력값 (유효성 검사 필수)
            if (dto.getNickNm() == null || dto.getNickNm().trim().isEmpty()) {
                throw new CustomException(ErrorCode.INVALID_INPUT, "일반 회원은 닉네임을 반드시 입력해야 합니다.");
            }
            return dto.getNickNm();
        }
    }

    // 아이디 중복 확인 로직
    public boolean isUserIdAvailable(String userId){
        // 나중에 "탈퇴한 회원 아이디는 30일간 재사용 금지" 같은 규칙이 생겨도 여기만 고치면 됨!
        return !userRepository.existsByUserId(userId);
    }

    // 이메일 중복 확인 로직 (해싱 포함)
    public boolean isEmailAvailable(String email){
        // 해싱 로직(요리법)은 셰프(Service)의 몫!
        String emailHash = hashUtil.generateHash(email);
        return !userRepository.existsByEmailHash(emailHash);
    }

    // 휴대폰 번호 중복 확인 로직 (해싱 포함)
    public boolean isPhoneAvailable(String phone){
        String phoneHash = hashUtil.generateHash(phone);
        return !userRepository.existsByPhoneHash(phoneHash);
    }


    // 리프레시 토큰 재발급 처리.
    @Transactional
    public TokenDTO refresh(HttpServletRequest request) {
        // 1. 쿠키에서 refreshToken 찾기
        String oldRefreshToken = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    oldRefreshToken = cookie.getValue();
                }
            }
        }

        // 쿠키가 없거나 유효하지 않으면 컷!
        if (oldRefreshToken == null || !jwtTokenProvider.validateToken(oldRefreshToken)) {
            throw new CustomException(ErrorCode.EXPIRED_TOKEN, "세션이 만료되었습니다. 다시 로그인해주세요.");
        }

        // 2. 토큰에서 이메일 추출
        String email = jwtTokenProvider.parseClaims(oldRefreshToken).getSubject();

        // 3. DB에서 유저 대조
        String emailHash = hashUtil.generateHash(email);
        User user = userRepository.findByEmailHash(emailHash)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다."));

        if ("S03".equals(user.getStatusCode()) || "S99".equals(user.getStatusCode())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "이용이 정지되거나 탈퇴한 계정입니다.");
        }

        // 4. 저장소 토큰 대조 (탈취 방지)
        RefreshToken savedToken = refreshTokenService.findByUserNo(user.getUserNo());
        String hashedOldRefreshToken = hashUtil.generateHash(oldRefreshToken);

        if (!savedToken.getTokenValue().equals(hashedOldRefreshToken)) {
            refreshTokenService.deleteToken(savedToken);
            throw new CustomException(ErrorCode.INVALID_TOKEN, "비정상적인 접근이 감지되었습니다. 다시 로그인해주세요.");
        }

        // 5. ★★★ 토큰 검증 성공 후, 즉시 기존 토큰을 무효화(삭제)합니다.
        // 이렇게 하면 동일한 토큰으로 동시에 재발급을 요청하는 경쟁 상태(Race Condition)를 막을 수 있습니다.
        refreshTokenService.deleteByUserNo(user.getUserNo());

        // 6. 권한 객체 생성
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(user.getRoleCode())
        );
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(email, null, authorities);

        // 7. 새로운 토큰 세트 발급
        TokenDTO newTokenDTO = jwtTokenProvider.createToken(
                auth, user.getUserNo(), user.getUserNm(), user.getNickNm()
        );
        newTokenDTO.setPasswordChangeRequired("Y".equalsIgnoreCase(user.getPwChangeRequired()));
        newTokenDTO.setRole(user.getRoleCode());

        // 8. RTR (Refresh Token Rotation) - 새로 발급된 리프레시 토큰을 DB에 저장합니다.
        refreshTokenService.saveRefreshToken(user.getUserNo(), newTokenDTO.getRefreshToken());

        return newTokenDTO;
    }

    @Transactional
    public void changePassword(Long userNo, String newPassword) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다."));

        if (!"Y".equalsIgnoreCase(user.getPwChangeRequired())) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "임시 비밀번호 변경 대상이 아닙니다.");
        }

        String encodedPw = passwordEncoder.encode(newPassword);
        user.setUserPw(encodedPw);
        user.setPwChangeRequired("N");
        userRepository.save(user);
    }

    @Transactional
    public void logout(String refreshToken, HttpServletResponse response) {
        if (refreshToken != null) {
            refreshTokenRepository.findByTokenValue(hashUtil.generateHash(refreshToken))
                    .ifPresent(refreshTokenRepository::delete);
        }
        ResponseCookie expiredCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
    }
}