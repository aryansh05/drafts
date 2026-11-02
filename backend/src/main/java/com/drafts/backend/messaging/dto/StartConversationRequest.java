package com.drafts.backend.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StartConversationRequest(
    @NotBlank @Size(max = 100) String recipientUsername,
    @NotBlank @Size(max = 4000) String content) {
}
