package com.drafts.backend.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.drafts.backend.auth.dto.AuthResponse;
import com.drafts.backend.auth.dto.LoginRequest;
import com.drafts.backend.auth.dto.RegisterRequest;
import com.drafts.backend.user.User;
import com.drafts.backend.user.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final RefreshTokenService refreshTokenService;
  private final AuthCookieService authCookieService;
  private final UserRepository userRepository;

  private ResponseEntity<AuthResponse> createSession(User user, HttpStatus status) {
    return ResponseEntity.status(status)
        .headers(authCookieService.issue(user))
        .body(authCookieService.publicUser(user));
  }

  @GetMapping("/csrf")
  public ResponseEntity<CsrfResponse> csrf() {
    var headers = new org.springframework.http.HttpHeaders();
    String token = authCookieService.issueCsrf(headers);
    return ResponseEntity.ok().headers(headers).body(new CsrfResponse(token));
  }

  @GetMapping("/me")
  public AuthResponse currentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue");
    }
    User user = userRepository.findByUsername(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue"));
    return authCookieService.publicUser(user);
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
    return createSession(authService.register(req), HttpStatus.CREATED);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest req) {
    return createSession(authService.login(req), HttpStatus.ACCEPTED);
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refresh(
      @CookieValue(name = AuthCookieService.REFRESH_COOKIE, required = false) String refreshToken) {
    if (refreshToken == null || refreshToken.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .headers(authCookieService.clear())
          .build();
    }
    try {
      RefreshTokenService.RotatedSession session = refreshTokenService.rotate(refreshToken);
      return ResponseEntity.ok()
          .headers(authCookieService.issue(session.user(), session.refreshToken()))
          .body(authCookieService.publicUser(session.user()));
    } catch (ResponseStatusException exception) {
      return ResponseEntity.status(exception.getStatusCode())
          .headers(authCookieService.clear())
          .build();
    }
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @CookieValue(name = AuthCookieService.REFRESH_COOKIE, required = false) String refreshToken) {
    if (refreshToken != null && !refreshToken.isBlank()) {
      refreshTokenService.revoke(refreshToken);
    }
    return ResponseEntity.noContent().headers(authCookieService.clear()).build();
  }

  public record CsrfResponse(String token) {
  }
}
