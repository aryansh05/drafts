package com.drafts.backend.blog;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.drafts.backend.blog.dto.BlogResponse;
import com.drafts.backend.blog.dto.BlogStatsResponse;
import com.drafts.backend.blog.dto.CreateBlogRequest;
import com.drafts.backend.blog.dto.UpdateBlogRequest;
import com.drafts.backend.user.User;
import com.drafts.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BlogService {

  private final UserRepository userRepository;
  private final BlogRepository blogRepository;
  private final BlogCommentRepository blogCommentRepository;
  private final BlogLikeRepository blogLikeRepository;

  public BlogResponse toResponse(Blog blog) {
    return toResponse(blog, false);
  }

  private BlogResponse toResponse(Blog blog, boolean likedByCurrentUser) {
    return new BlogResponse(
        blog.getId(),
        blog.getTitle(),
        blog.getSlug(),
        blog.getDisc(),
        blog.getContent(),
        blog.getImageUrl(),
        blog.isPublish(),
        blog.getCreator().getId(),
        blog.getCreator().getUsername(),
        blog.getCreator().getProfileImageUrl(),
        blog.getCreatedAt(),
        blog.getUpdatedAt(),
        blog.getLikeCount(),
        likedByCurrentUser);
  }

  public String createSlug(String title) {
    String normalized = Normalizer.normalize(title, Normalizer.Form.NFD);

    String slug = normalized.replaceAll("\\p{M}", "")
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-|-$)", "");
    return slug.isBlank() ? "article" : slug;
  }

  public String uniqueSlug(String title) {
    String orgSlug = createSlug(title);
    String slug = orgSlug;
    int cnt = 1;
    while (blogRepository.existsBySlug(slug)) {
      slug = orgSlug + "-" + cnt;
      cnt++;
    }
    return slug;
  }

  @Transactional
  public BlogResponse create(
      CreateBlogRequest req,
      String username) {
    User creator = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    Blog blog = Blog.builder()
        .title(req.title())
        .slug(uniqueSlug(req.title()))
        .disc(req.disc())
        .content(req.content())
        .imageUrl(req.imageUrl())
        .creator(creator)
        .build();

    return toResponse(blogRepository.save(blog));
  }

  @Transactional(readOnly = true)
  public Page<BlogResponse> getPublish(Pageable page, String query, String username) {
    Page<Blog> blogs = blogRepository.searchPublished(escapeLikeQuery(query), page);
    if (username == null || blogs.isEmpty()) return blogs.map(this::toResponse);
    var ids = blogs.getContent().stream().map(Blog::getId).toList();
    var likedIds = new java.util.HashSet<>(userRepository.findByUsername(username)
        .map(user -> blogLikeRepository.findLikedBlogIds(user.getId(), ids))
        .orElseGet(java.util.List::of));
    return blogs.map(blog -> toResponse(blog, likedIds.contains(blog.getId())));
  }

  @Transactional(readOnly = true)
  public BlogResponse getPublishBySlug(String slug, String username) {
    Blog blog = blogRepository.findBySlug(slug)
        .filter(bg -> bg.isPublish())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "blog not found"));

    boolean liked = username != null && userRepository.findByUsername(username)
        .map(user -> blogLikeRepository.existsByBlogIdAndUserId(blog.getId(), user.getId()))
        .orElse(false);
    return toResponse(blog, liked);
  }

  @Transactional(readOnly = true)
  public Page<BlogResponse> getMine(String username, String query, String status, Pageable page) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    return blogRepository.searchMine(
        user.getUsername(),
        escapeLikeQuery(query),
        status,
        page).map(this::toResponse);
  }

  @Transactional(readOnly = true)
  public Page<BlogResponse> getPublishedByCreator(String username, Pageable page) {
    return blogRepository.searchMine(username, "", "published", page).map(this::toResponse);
  }

  private String escapeLikeQuery(String query) {
    if (query == null) return "";
    return query.trim()
        .replace("!", "!!")
        .replace("%", "!%")
        .replace("_", "!_");
  }

  @Transactional(readOnly = true)
  public BlogResponse getMineById(UUID id, String username) {
    Blog blog = blogRepository.findByIdAndCreatorUsername(id, username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
    return toResponse(blog);
  }

  @Transactional(readOnly = true)
  public BlogStatsResponse getMineStats(String username) {
    return new BlogStatsResponse(
        blogRepository.countByCreatorUsername(username),
        blogRepository.countByCreatorUsernameAndPublishFalse(username),
        blogRepository.countByCreatorUsernameAndPublishTrue(username));
  }

  @Transactional
  public BlogResponse update(UUID id, UpdateBlogRequest req, String username, boolean admin) {
    Blog blog = blogRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "blog not found"));
    if (!admin && !blog.getCreator().getUsername().equals(username)) {
      throw new AccessDeniedException("You do not have access to the right's of this blog");
    }

    String newTitle = req.title().trim();
    if (!newTitle.equals(blog.getTitle())) {
      blog.setTitle(newTitle);
      blog.setSlug(uniqueSlug(newTitle));
    }

    blog.setDisc(req.disc());
    blog.setContent(req.content());
    blog.setImageUrl(req.imageUrl());

    return toResponse(blogRepository.save(blog));
  }

  @Transactional
  public BlogResponse publish(UUID id, String username, boolean admin) {

    Blog blog = blogRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "blog not found"));
    if (!admin && !blog.getCreator().getUsername().equals(username)) {
      throw new AccessDeniedException("You do not have access to the right's of this blog");
    }
    if (blog.isPublish()) {
      return toResponse(blog);
    }
    blog.setPublish(true);
    return toResponse(blogRepository.save(blog));
  }

  @Transactional
  public void delete(UUID id, String username, boolean admin) {

    Blog blog = blogRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "blog not found"));
    if (!admin && !blog.getCreator().getUsername().equals(username)) {
      throw new AccessDeniedException("You do not have access to the right's of this blog");
    }

    blogCommentRepository.deleteByBlogIdAndParentCommentIsNotNull(blog.getId());
    blogCommentRepository.deleteByBlogIdAndParentCommentIsNull(blog.getId());
    blogLikeRepository.deleteByBlogId(blog.getId());
    blogRepository.delete(blog);
  }

}
