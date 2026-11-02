package com.drafts.backend.blog.dto;

import java.time.Instant;
import java.util.UUID;

public record BlogResponse(

    UUID id,
    String title,
    String slug,
    String disc,
    String content,
    String imageUrl,
    boolean publish,
    UUID creatorId,
    String creatorUsername,
    String creatorProfileImageUrl,
    Instant createdAt,
    Instant updatedAt,
    int likeCount,
    boolean likedByCurrentUser

) {
}
