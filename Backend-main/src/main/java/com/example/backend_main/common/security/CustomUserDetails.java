package com.example.backend_main.common.security;

import com.example.backend_main.common.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Long userNo;      // PK
    private final String userId;    // 아이디
    private final String password;  // 비밀번호
    private final String roleCode;  // 권한
    private final String nickNm;    //  닉네임 필드!

    // User 엔티티를 받아서 초기화
    public CustomUserDetails(User user) {
        this.userNo = user.getUserNo();
        this.userId = user.getUserId();
        this.password = user.getUserPw();
        this.roleCode = user.getRoleCode();
        this.nickNm = user.getNickNm(); // DB에서 가져온 닉네임 저장
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(roleCode));
    }

    @Override
    public String getUsername() {
        return userId;
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}