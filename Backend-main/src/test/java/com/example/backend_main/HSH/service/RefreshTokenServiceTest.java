package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.RefreshToken;
import com.example.backend_main.common.repository.RefreshTokenRepository;
import com.example.backend_main.common.util.HashUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private HashUtil hashUtil;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @Test
    void saveRefreshToken_기존토큰없음_신규저장() {
        when(hashUtil.generateHash(eq("plainToken"))).thenReturn("hashedToken");
        when(refreshTokenRepository.findByUserNo(1L)).thenReturn(Optional.empty());

        refreshTokenService.saveRefreshToken(1L, "plainToken");

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken captured = captor.getValue();
        assertThat(captured.getUserNo()).isEqualTo(1L);
        assertThat(captured.getTokenValue()).isEqualTo("hashedToken");
        assertThat(captured.getExpireDt()).isAfter(LocalDateTime.now());
    }

    @Test
    void saveRefreshToken_기존토큰있음_업데이트() {
        when(hashUtil.generateHash(eq("plainToken"))).thenReturn("hashedToken");

        RefreshToken existing = RefreshToken.builder()
                .tokenId(10L)
                .userNo(1L)
                .tokenValue("oldHash")
                .expireDt(LocalDateTime.now().minusDays(1))
                .build();
        when(refreshTokenRepository.findByUserNo(1L)).thenReturn(Optional.of(existing));

        refreshTokenService.saveRefreshToken(1L, "plainToken");

        assertThat(existing.getTokenValue()).isEqualTo("hashedToken");
        assertThat(existing.getExpireDt()).isAfter(LocalDateTime.now());
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void findByUserNo_정상_엔티티반환() {
        RefreshToken entity = RefreshToken.builder()
                .tokenId(1L)
                .userNo(1L)
                .tokenValue("hv")
                .expireDt(LocalDateTime.now().plusDays(7))
                .build();
        when(refreshTokenRepository.findByUserNo(1L)).thenReturn(Optional.of(entity));

        RefreshToken result = refreshTokenService.findByUserNo(1L);

        assertThat(result).isNotNull();
    }

    @Test
    void findByUserNo_없음_IllegalArgumentException() {
        when(refreshTokenRepository.findByUserNo(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> refreshTokenService.findByUserNo(1L));
    }

    @Test
    void deleteByUserNo_호출확인() {
        refreshTokenService.deleteByUserNo(1L);

        verify(refreshTokenRepository).deleteByUserNo(1L);
    }

    @Test
    void deleteToken_호출확인() {
        RefreshToken entity = RefreshToken.builder()
                .tokenId(99L)
                .userNo(2L)
                .tokenValue("x")
                .expireDt(LocalDateTime.now().plusDays(1))
                .build();

        refreshTokenService.deleteToken(entity);

        verify(refreshTokenRepository).delete(entity);
    }
}
