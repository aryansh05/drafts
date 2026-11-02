package com.drafts.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.drafts.backend.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
  public static final long REFRESH_LIFETIME_SECONDS = 2_592_000;
  private static final SecureRandom RANDOM = new SecureRandom();

  private final RefreshTokenRepository refreshTokenRepository;

  @Transactional
  public String issue(User user) {
    byte[] bytes = new byte[48];
    RANDOM.nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    refreshTokenRepository.save(RefreshToken.builder()
        .tokenHash(hash(token))
        .user(user)
        .expiresAt(Instant.now().plus(REFRESH_LIFETIME_SECONDS, ChronoUnit.SECONDS))
        .build());
    return token;
  }

  @Transactional(noRollbackFor = ResponseStatusException.class)
  public RotatedSession rotate(String rawToken) {
    String tokenHash = hash(rawToken);
    RefreshToken current = refreshTokenRepository.findForUpdate(tokenHash)
        .orElseThrow(this::expiredSession);
    if (!current.getExpiresAt().isAfter(Instant.now())) {
      refreshTokenRepository.delete(current);
      throw expiredSession();
    }

    User user = current.getUser();
    refreshTokenRepository.delete(current);
    String nextToken = issue(user);
    return new RotatedSession(user, nextToken);
  }

  @Transactional
  public void revoke(String rawToken) {
    refreshTokenRepository.deleteByTokenHash(hash(rawToken));
  }

  private ResponseStatusException expiredSession() {
    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh session expired");
  }

  private String hash(String token) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256")
          .digest(token.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is unavailable", exception);
    }
  }

  public record RotatedSession(User user, String refreshToken) {
  }
}
