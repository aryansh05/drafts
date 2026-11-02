package com.drafts.backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAccountRequest(
    @NotBlank @Size(min = 3, max = 100) @Pattern(regexp = "^[^@]+$") String username,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank String currentPassword) {
}
