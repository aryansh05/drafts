package com.drafts.backend.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileImageRequest(
    @Size(max = 1000)
    @Pattern(regexp = "^(|https://[^\\s]+)$", message = "Choose an HTTPS image URL")
    String profileImageUrl) {
}
