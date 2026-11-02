package com.drafts.backend.blog;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.drafts.backend.blog.dto.BlogResponse;
import com.drafts.backend.blog.dto.BlogPageResponse;
import com.drafts.backend.blog.dto.BlogStatsResponse;
import com.drafts.backend.blog.dto.CreateBlogRequest;
import com.drafts.backend.blog.dto.CommentResponse;
import com.drafts.backend.blog.dto.CreateCommentRequest;
import com.drafts.backend.blog.dto.UpdateBlogRequest;
import com.drafts.backend.blog.dto.BlogLikeResponse;
import com.drafts.backend.blog.dto.SetLikeRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

  private final BlogService blogService;
  private final BlogCommentService blogCommentService;
  private final BlogLikeService blogLikeService;

  @GetMapping("/likes")
  public java.util.List<UUID> getLikedBlogIds(
      @RequestParam java.util.List<UUID> ids,
      Authentication authentication) {
    return blogLikeService.likedBlogIds(ids, authentication.getName());
  }

  @PutMapping("/{id}/like")
  public BlogLikeResponse setLike(
      @PathVariable UUID id,
      @RequestBody SetLikeRequest request,
      Authentication authentication) {
    return blogLikeService.setLike(id, request.liked(), authentication.getName());
  }

  @GetMapping("/{blogId}/comments")
  public BlogPageResponse<CommentResponse> getComments(
      @PathVariable String blogId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return blogCommentService.list(blogId, page, size);
  }

  @PostMapping("/{blogId}/comments")
  public ResponseEntity<CommentResponse> createComment(
      @PathVariable String blogId,
      @Valid @RequestBody CreateCommentRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(blogCommentService.create(blogId, request, authentication.getName()));
  }

  @PostMapping("/{blogId}/comments/{commentId}/replies")
  public ResponseEntity<CommentResponse> replyToComment(
      @PathVariable String blogId,
      @PathVariable UUID commentId,
      @Valid @RequestBody CreateCommentRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(blogCommentService.reply(blogId, commentId, request, authentication.getName()));
  }

  @PostMapping
  public ResponseEntity<BlogResponse> createBlog(@Valid @RequestBody CreateBlogRequest req,
      Authentication authentication) {
    BlogResponse response = blogService.create(req, authentication.getName());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PutMapping("/{id}")
  public ResponseEntity<BlogResponse> updateBlog(@PathVariable UUID id, @Valid @RequestBody UpdateBlogRequest req,
      Authentication authentication) {
    boolean admin = authentication.getAuthorities().stream()
        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
    BlogResponse response = blogService.update(id, req, authentication.getName(), admin);

    return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
  }

  @PatchMapping("/{id}/publish")
  public ResponseEntity<BlogResponse> publish(@PathVariable UUID id, Authentication authentication) {
    boolean admin = authentication.getAuthorities().stream()
        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
    BlogResponse response = blogService.publish(id, authentication.getName(), admin);

    return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
    boolean admin = authentication.getAuthorities().stream()
        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
    blogService.delete(id, authentication.getName(), admin);
    return ResponseEntity.noContent().build();
  }

  @GetMapping
  public BlogPageResponse<BlogResponse> getPublish(
      @PageableDefault(size = 9) Pageable page,
      Authentication authentication,
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "popular") String order) {
    Sort sort = switch (order) {
      case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
      case "title" -> Sort.by(Sort.Direction.ASC, "title");
      case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
      default -> Sort.by(Sort.Direction.DESC, "likeCount").and(Sort.by(Sort.Direction.DESC, "createdAt"));
    };
    Pageable safePage = PageRequest.of(page.getPageNumber(), Math.max(1, Math.min(page.getPageSize(), 50)), sort);
    return BlogPageResponse.from(blogService.getPublish(
        safePage,
        q,
        authentication == null ? null : authentication.getName()));
  }

  @GetMapping("/creator/{username}")
  public BlogPageResponse<BlogResponse> getPublishedByCreator(
      @PathVariable String username,
      @PageableDefault(size = 12) Pageable page) {
    Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
    Pageable safePage = PageRequest.of(page.getPageNumber(), Math.max(1, Math.min(page.getPageSize(), 50)), sort);
    return BlogPageResponse.from(blogService.getPublishedByCreator(username, safePage));
  }

  @GetMapping("/{slug}")
  public BlogResponse getPublishBySlug(@PathVariable String slug, Authentication authentication) {
    return blogService.getPublishBySlug(slug, authentication == null ? null : authentication.getName());
  }

  @GetMapping("/mine")
  public BlogPageResponse<BlogResponse> getMine(
      @PageableDefault(size = 20, sort = "updatedAt", direction = Direction.DESC) Pageable page,
      Authentication authentication,
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "all") String status,
      @RequestParam(defaultValue = "updated") String order) {
    String safeStatus = switch (status) {
      case "drafts", "published" -> status;
      default -> "all";
    };
    Sort sort = switch (order) {
      case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
      case "title" -> Sort.by(Sort.Direction.ASC, "title");
      default -> Sort.by(Sort.Direction.DESC, "updatedAt");
    };
    Pageable safePage = PageRequest.of(page.getPageNumber(), Math.max(1, Math.min(page.getPageSize(), 50)), sort);
    return BlogPageResponse.from(blogService.getMine(authentication.getName(), q, safeStatus, safePage));
  }

  @GetMapping("/mine/{id}")
  public BlogResponse getMineById(@PathVariable UUID id, Authentication authentication) {
    return blogService.getMineById(id, authentication.getName());
  }

  @GetMapping("/mine/stats")
  public BlogStatsResponse getMineStats(Authentication authentication) {
    return blogService.getMineStats(authentication.getName());
  }
}
