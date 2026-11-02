package com.drafts.backend.auth.dto;

import java.util.UUID;

import com.drafts.backend.user.Role;

public record AuthResponse(
    UUID id,
    String username,
    String email,
    Role role,
    String profileImageUrl) {
}
