package com.drafts.backend.messaging.dto;

import java.util.List;
import java.util.UUID;

public record MessageThreadResponse(
    UUID conversationId,
    UUID otherUserId,
    String otherUsername,
    List<MessageResponse> messages) {
}
