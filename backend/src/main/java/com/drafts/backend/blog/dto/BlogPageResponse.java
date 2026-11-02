package com.drafts.backend.blog.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record BlogPageResponse<T>(
    List<T> content,
    int totalPages,
    long totalElements,
    int number,
    int size,
    boolean first,
    boolean last,
    boolean empty) {

  public static <T> BlogPageResponse<T> from(Page<T> page) {
    return new BlogPageResponse<>(
        page.getContent(),
        page.getTotalPages(),
        page.getTotalElements(),
        page.getNumber(),
        page.getSize(),
        page.isFirst(),
        page.isLast(),
        page.isEmpty());
  }
}
