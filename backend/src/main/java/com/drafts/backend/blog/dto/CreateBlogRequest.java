package com.drafts.backend.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBlogRequest(
    @NotBlank @Size(max = 200) String title,

    @NotBlank @Size(max = 200) String disc,

    @NotBlank String content,

    @Size(max = 1000) String imageUrl

) {
}
