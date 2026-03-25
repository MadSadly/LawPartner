package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.util.HashUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final HashUtil hashUtil; // ★ 해시 도구 주입

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. 토큰에서 넘어온 평문 이메일을 SHA-256 해시값으로 변환
        String emailHash = hashUtil.generateHash(email);

        // 2. DB의 emailHash 컬럼과 대조하여 유저를 찾음
        // (UserRepository에 findByEmailHash 메서드가 필요합니다)
        User user = userRepository.findByEmailHash(emailHash)
                .orElseThrow(() -> new UsernameNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다."));

        return new CustomUserDetails(user);
    }
}