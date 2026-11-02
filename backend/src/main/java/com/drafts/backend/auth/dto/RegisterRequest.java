package com.drafts.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Username is required") @Size(min = 3, max = 100, message = "Username must be between 3 and 100 characters") @Pattern(regexp = "^[^@]+$", message = "Username must not contain @") String username,

    @NotBlank(message = "Email is required") @Email(message = "Provide a valid email") @Size(min = 3, max = 255, message = "Email must be between 3-255 characters") String email,

    @NotBlank(message = "Password is required") @Size(min = 8, max = 150, message = "Password must be 8-150 characters") String password) {
}
