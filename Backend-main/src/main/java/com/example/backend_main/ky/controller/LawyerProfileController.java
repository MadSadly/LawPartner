package com.example.backend_main.ky.controller;

import com.example.backend_main.common.entity.LawyerInfo;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.LawyerInfoRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.ky.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;

/*
 * [KY] 변호사 전용 프로필 API
 * GET  /api/ky/profile         - 전문분야, 소개글, 사진 URL 조회
 * PUT  /api/ky/profile         - 전문분야, 소개글 저장
 * POST /api/ky/profile/image   - 프로필 사진 업로드 & 저장
 */
@RestController
@RequestMapping("/api/ky")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://192.168.0.43:3000", "http://localhost:3000"})
public class LawyerProfileController {

    private final LawyerInfoRepository  lawyerInfoRepository;
    private final UserRepository         userRepository;
    private final JwtTokenProvider       jwtTokenProvider;
    private final PasswordEncoder        passwordEncoder;
    private final SubscriptionRepository subscriptionRepository;

    // ─── 전문분야 / 소개글 / 사진 URL 조회 ─────────────────────────
    @GetMapping("/profile")
    public ResultVO<Map<String, Object>> getLawyerProfile(
            @RequestHeader("Authorization") String token) {

        Long lawyerNo = extractUserNo(token);
        if (lawyerNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");

        Map<String, Object> data = new HashMap<>();
        lawyerInfoRepository.findById(lawyerNo).ifPresent(info -> {
            // 전문분야: "민사,형사" → ["민사","형사"]
            List<String> specialties = (info.getSpecialtyStr() != null && !info.getSpecialtyStr().isBlank())
                    ? Arrays.asList(info.getSpecialtyStr().split(","))
                    : new ArrayList<>();
            data.put("specialties", specialties);
            data.put("bio",    info.getIntroText());
            data.put("imgUrl", info.getImgUrl());
        });

        return ResultVO.ok("조회 성공", data);
    }

    // ─── 전문분야 / 소개글 저장 ────────────────────────────────────
    @PutMapping("/profile")
    @Transactional
    public ResultVO<String> updateLawyerProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> body) {

        Long lawyerNo = extractUserNo(token);
        if (lawyerNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");

        LawyerInfo info = lawyerInfoRepository.findById(lawyerNo)
                .orElseGet(() -> {
                    // LawyerInfo 레코드가 없으면 새로 생성
                    com.example.backend_main.common.entity.User user =
                            userRepository.findById(lawyerNo).orElseThrow();
                    return LawyerInfo.builder()
                            .user(user)
                            .licenseFile("")
                            .build();
                });

        if (body.containsKey("specialties")) {
            @SuppressWarnings("unchecked")
            List<String> specs = (List<String>) body.get("specialties");
            info.setSpecialtyStr(String.join(",", specs));
        }
        if (body.containsKey("bio")) {
            info.setIntroText((String) body.get("bio"));
        }
        lawyerInfoRepository.save(info);

        return ResultVO.ok("저장 성공", null);
    }

    // ─── 프로필 사진 업로드 ────────────────────────────────────────
    @PostMapping("/profile/image")
    @Transactional
    public ResultVO<String> uploadProfileImage(
            @RequestHeader("Authorization") String token,
            @RequestParam("file") MultipartFile file) throws IOException {

        Long lawyerNo = extractUserNo(token);
        if (lawyerNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");

        // 저장 폴더: 프로젝트 루트/uploads/
        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        new File(uploadDir).mkdirs();

        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(f -> f.contains("."))
                .map(f -> f.substring(f.lastIndexOf(".")))
                .orElse(".jpg");
        String fileName = "lawyer_" + lawyerNo + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        file.transferTo(new File(uploadDir + fileName));
        String imgUrl = "/uploads/" + fileName;

        // LawyerInfo에 URL 저장 (없으면 새로 생성)
        LawyerInfo info = lawyerInfoRepository.findById(lawyerNo).orElseGet(() -> {
            com.example.backend_main.common.entity.User user =
                    userRepository.findById(lawyerNo).orElseThrow();
            return LawyerInfo.builder().user(user).licenseFile("").build();
        });
        info.setImgUrl(imgUrl);
        lawyerInfoRepository.save(info);

        return ResultVO.ok("업로드 성공", imgUrl);
    }

    // ─── 회원탈퇴 ──────────────────────────────────────────────────
    @DeleteMapping("/account")
    @Transactional
    public ResultVO<String> deleteAccount(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {

        Long userNo = extractUserNo(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");

        String password = body.get("password");
        if (password == null || password.isBlank())
            return ResultVO.fail("PARAM-400", "비밀번호를 입력해주세요.");

        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(password, user.getUserPw()))
            return ResultVO.fail("AUTH-403", "비밀번호가 일치하지 않습니다.");

        // 구독 정보 삭제
        subscriptionRepository.deleteByUser_UserNo(userNo);

        // 계정 비활성화 (S99: 탈퇴)
        user.setStatusCode("S99");
        String uid = UUID.randomUUID().toString().substring(0, 8);
        user.setUserId("deleted_" + userNo + "_" + uid);
        user.setNickNm("탈퇴한 사용자" + uid);
        user.setEmail(user.getEmailHash());
        user.setPhone(user.getPhoneHash());
        user.setEmailHash("deleted_" + userNo + "_" + uid + "@law.com");
        user.setPhoneHash("010-0000-" + userNo);

        return ResultVO.ok("탈퇴 처리가 완료되었습니다.", null);
    }

    // ─── 공통: Authorization 헤더에서 userNo 추출 ─────────────────
    private Long extractUserNo(String token) {
        return jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
    }
}
