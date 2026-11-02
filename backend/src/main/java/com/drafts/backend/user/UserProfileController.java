package com.drafts.backend.user;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.drafts.backend.auth.AuthCookieService;
import com.drafts.backend.auth.RefreshTokenRepository;
import com.drafts.backend.auth.dto.AuthResponse;
import com.drafts.backend.user.dto.ChangePasswordRequest;
import com.drafts.backend.user.dto.UpdateAccountRequest;
import com.drafts.backend.user.dto.UpdateProfileImageRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final RefreshTokenRepository refreshTokenRepository;
  private final AuthCookieService authCookieService;

  @GetMapping("/{username}")
  public UserProfileResponse getProfile(@PathVariable String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return new UserProfileResponse(user.getUsername(), user.getProfileImageUrl());
  }

  @PutMapping("/me/profile-image")
  public UserProfileResponse updateProfileImage(
      @Valid @RequestBody UpdateProfileImageRequest request,
      Authentication authentication) {
    User user = userRepository.findByUsername(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    user.setProfileImageUrl(
        request.profileImageUrl() == null || request.profileImageUrl().isBlank()
            ? null
            : request.profileImageUrl());
    userRepository.save(user);
    return new UserProfileResponse(user.getUsername(), user.getProfileImageUrl());
  }

  @Transactional
  @PutMapping("/me/account")
  public ResponseEntity<AuthResponse> updateAccount(
      @Valid @RequestBody UpdateAccountRequest request,
      Authentication authentication) {
    User user = requireCurrentUser(authentication);
    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
    }
    String username = request.username().trim();
    String email = request.email().trim().toLowerCase(Locale.ROOT);
    if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already in use.");
    }
    if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "That email address is already in use.");
    }
    user.setUsername(username);
    user.setEmail(email);
    userRepository.save(user);
    return newSession(user);
  }

  @Transactional
  @PutMapping("/me/password")
  public ResponseEntity<AuthResponse> changePassword(
      @Valid @RequestBody ChangePasswordRequest request,
      Authentication authentication) {
    User user = requireCurrentUser(authentication);
    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
    }
    user.setPassword(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
    return newSession(user);
  }

  private User requireCurrentUser(Authentication authentication) {
    return userRepository.findByUsername(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  private ResponseEntity<AuthResponse> newSession(User user) {
    refreshTokenRepository.deleteAllForUser(user.getId());
    return ResponseEntity.ok()
        .headers(authCookieService.issue(user))
        .body(authCookieService.publicUser(user));
  }
}
