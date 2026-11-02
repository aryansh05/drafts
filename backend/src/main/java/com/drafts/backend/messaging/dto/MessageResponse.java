package com.drafts.backend.messaging.dto;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
    UUID id,
    UUID senderId,
    String senderUsername,
    String content,
    Instant createdAt,
    Instant readAt) {
}
