package com.drafts.backend.auth;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.drafts.backend.auth.dto.LoginRequest;
import com.drafts.backend.auth.dto.RegisterRequest;
import com.drafts.backend.user.Role;
import com.drafts.backend.user.User;
import com.drafts.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional(readOnly = true)
  public User login(LoginRequest req) {
    String name = req.name().trim();

    User user;
    if (name.contains("@")) {
      user = userRepository.findByEmail(name.toLowerCase())
          .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    } else {
      user = userRepository.findByUsername(name)
          .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    }

    if (!passwordEncoder.matches(req.password(), user.getPassword())) {
      throw new BadCredentialsException("Invalid credentials");
    }

    return user;
  }

  @Transactional
  public User register(RegisterRequest req) {
    String username = req.username().trim();
    String email = req.email().trim().toLowerCase();

    if (userRepository.existsByEmail(email)) {
      throw new IllegalArgumentException("Email already in use");
    }
    if (userRepository.existsByUsername(username)) {
      throw new IllegalArgumentException("Username already in use");
    }

    User user = User.builder()
        .username(username)
        .email(email)
        .password(passwordEncoder.encode(req.password()))
        .role(Role.USER)
        .build();

    return userRepository.save(user);
  }
}
