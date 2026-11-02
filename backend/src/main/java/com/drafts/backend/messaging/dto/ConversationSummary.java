package com.drafts.backend.messaging.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationSummary(
    UUID id,
    UUID otherUserId,
    String otherUsername,
    String latestMessage,
    Instant updatedAt,
    long unreadCount) {
}
