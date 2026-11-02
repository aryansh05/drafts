package com.drafts.backend.auth;

import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.drafts.backend.auth.dto.AuthResponse;
import com.drafts.backend.user.User;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthCookieService {

  public static final String ACCESS_COOKIE = "drafts_access";
  public static final String REFRESH_COOKIE = "drafts_refresh";
  public static final String CSRF_COOKIE = "drafts_csrf";
  private static final SecureRandom RANDOM = new SecureRandom();

  private final JwtService jwtService;
  private final RefreshTokenService refreshTokenService;

  @Value("${app.auth.secure-cookies:true}")
  private boolean secureCookies;

  public AuthResponse publicUser(User user) {
    return new AuthResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getRole(),
        user.getProfileImageUrl());
  }

  public HttpHeaders issue(User user) {
    return issue(user, refreshTokenService.issue(user));
  }

  public HttpHeaders issue(User user, String refreshToken) {
    HttpHeaders headers = new HttpHeaders();
    headers.add(HttpHeaders.SET_COOKIE, cookie(ACCESS_COOKIE, jwtService.generateToken(user), "/api", 3600, true));
    headers.add(HttpHeaders.SET_COOKIE, cookie(
        REFRESH_COOKIE,
        refreshToken,
        "/api/auth",
        RefreshTokenService.REFRESH_LIFETIME_SECONDS,
        true));
    headers.add(HttpHeaders.SET_COOKIE, cookie(CSRF_COOKIE, newCsrfToken(), "/", 2_592_000, false));
    headers.setCacheControl("no-store");
    return headers;
  }

  public String issueCsrf(HttpHeaders headers) {
    String token = newCsrfToken();
    headers.add(HttpHeaders.SET_COOKIE, cookie(CSRF_COOKIE, token, "/", 2_592_000, false));
    headers.setCacheControl("no-store");
    return token;
  }

  public HttpHeaders clear() {
    HttpHeaders headers = new HttpHeaders();
    headers.add(HttpHeaders.SET_COOKIE, cookie(ACCESS_COOKIE, "", "/api", 0, true));
    headers.add(HttpHeaders.SET_COOKIE, cookie(REFRESH_COOKIE, "", "/api/auth", 0, true));
    headers.add(HttpHeaders.SET_COOKIE, cookie(CSRF_COOKIE, "", "/", 0, false));
    headers.setCacheControl("no-store");
    return headers;
  }

  private String cookie(String name, String value, String path, long age, boolean httpOnly) {
    return ResponseCookie.from(name, value)
        .httpOnly(httpOnly)
        .secure(secureCookies)
        .path(path)
        .maxAge(age)
        .sameSite("Lax")
        .build()
        .toString();
  }

  private String newCsrfToken() {
    byte[] bytes = new byte[32];
    RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
