package com.example.backend_main.HSH.migration;

import com.example.backend_main.common.vo.ResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile("migration")
@RestController
@RequestMapping("/api/hsh/admin") // 내 패키지임을 명시
@RequiredArgsConstructor
public class AdminSecurityController {

    private final KeyRotationService keyRotationService;

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/execute-rotation")
    public ResultVO<?> executeRotation() {
        // 실무라면 여기서 권한 체크(ROLE_ADMIN)를 수행합니다.
        keyRotationService.rotateKeys();
        return ResultVO.ok("Security Key Rotation Complete", null);
    }
}