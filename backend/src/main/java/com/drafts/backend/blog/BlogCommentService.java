package com.drafts.backend.blog;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.drafts.backend.blog.dto.BlogPageResponse;
import com.drafts.backend.blog.dto.CommentResponse;
import com.drafts.backend.blog.dto.CreateCommentRequest;
import com.drafts.backend.user.User;
import com.drafts.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BlogCommentService {
  private final BlogRepository blogRepository;
  private final BlogCommentRepository commentRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public BlogPageResponse<CommentResponse> list(String blogId, int page, int size) {
    Blog blog = getPublishedBlog(blogId);
    Page<BlogComment> comments = commentRepository.findByBlogIdAndParentCommentIsNull(
        blog.getId(),
        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.ASC, "createdAt")));
    List<UUID> commentIds = comments.getContent().stream().map(BlogComment::getId).toList();
    Map<UUID, List<CommentResponse>> replies = commentIds.isEmpty()
        ? Map.of()
        : commentRepository.findReplies(blog.getId(), commentIds).stream()
            .collect(Collectors.groupingBy(
                reply -> reply.getParentComment().getId(),
                Collectors.mapping(reply -> toResponse(reply, blog.getCreator().getId()), Collectors.toList())));
    return BlogPageResponse.from(comments.map(comment -> toResponse(
        comment,
        blog.getCreator().getId(),
        replies.getOrDefault(comment.getId(), List.of()))));
  }

  @Transactional
  public CommentResponse create(String blogId, CreateCommentRequest request, String username) {
    Blog blog = getPublishedBlog(blogId);
    User creator = getUser(username);
    BlogComment comment = BlogComment.builder()
        .blog(blog)
        .creator(creator)
        .content(request.content().trim())
        .build();
    return toResponse(commentRepository.save(comment), blog.getCreator().getId());
  }

  @Transactional
  public CommentResponse reply(String blogId, UUID commentId, CreateCommentRequest request, String username) {
    Blog blog = getPublishedBlog(blogId);
    BlogComment parent = commentRepository.findById(commentId)
        .filter(comment -> comment.getBlog().getId().equals(blog.getId()))
        .filter(comment -> comment.getParentComment() == null)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
    BlogComment reply = BlogComment.builder()
        .blog(blog)
        .creator(getUser(username))
        .parentComment(parent)
        .content(request.content().trim())
        .build();
    return toResponse(commentRepository.save(reply), blog.getCreator().getId());
  }

  private Blog getPublishedBlog(String blogId) {
    var blog = parseId(blogId).flatMap(blogRepository::findById)
        .or(() -> blogRepository.findBySlug(blogId));
    return blog
        .filter(Blog::isPublish)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
  }

  private java.util.Optional<UUID> parseId(String value) {
    try {
      return java.util.Optional.of(UUID.fromString(value));
    } catch (IllegalArgumentException exception) {
      return java.util.Optional.empty();
    }
  }

  private User getUser(String username) {
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  private CommentResponse toResponse(BlogComment comment, UUID blogAuthorId) {
    return new CommentResponse(
        comment.getId(),
        comment.getContent(),
        comment.getCreator().getUsername(),
        comment.getCreator().getProfileImageUrl(),
        comment.getCreator().getId().equals(blogAuthorId),
        comment.getCreatedAt(),
        List.of());
  }

  private CommentResponse toResponse(
      BlogComment comment,
      UUID blogAuthorId,
      List<CommentResponse> replies) {
    return new CommentResponse(
        comment.getId(),
        comment.getContent(),
        comment.getCreator().getUsername(),
        comment.getCreator().getProfileImageUrl(),
        comment.getCreator().getId().equals(blogAuthorId),
        comment.getCreatedAt(),
        replies);
  }
}
