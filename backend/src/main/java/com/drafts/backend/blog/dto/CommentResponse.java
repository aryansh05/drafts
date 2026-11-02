package com.drafts.backend.blog.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record CommentResponse(
    UUID id,
    String content,
    String creatorUsername,
    String creatorImageUrl,
    boolean blogAuthor,
    Instant createdAt,
    List<CommentResponse> replies) {
}
