package com.drafts.backend.blog;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.drafts.backend.blog.dto.BlogLikeResponse;
import com.drafts.backend.user.User;
import com.drafts.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BlogLikeService {
  private final BlogRepository blogRepository;
  private final BlogLikeRepository likeRepository;
  private final UserRepository userRepository;

  @Transactional
  public BlogLikeResponse setLike(UUID blogId, boolean liked, String username) {
    Blog blog = blogRepository.findForUpdate(blogId)
        .filter(Blog::isPublish)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to like stories"));

    boolean wasLiked = likeRepository.existsByBlogIdAndUserId(blogId, user.getId());
    if (liked && !wasLiked) {
      BlogLike like = new BlogLike();
      like.setBlog(blog);
      like.setUser(user);
      likeRepository.save(like);
      blog.setLikeCount(blog.getLikeCount() + 1);
    } else if (!liked && wasLiked) {
      likeRepository.deleteByBlogIdAndUserId(blogId, user.getId());
      blog.setLikeCount(Math.max(0, blog.getLikeCount() - 1));
    }

    return new BlogLikeResponse(blog.getLikeCount(), liked);
  }

  @Transactional(readOnly = true)
  public List<UUID> likedBlogIds(List<UUID> blogIds, String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to view likes"));
    if (blogIds.isEmpty()) return List.of();
    return likeRepository.findLikedBlogIds(user.getId(), blogIds.subList(0, Math.min(100, blogIds.size())));
  }
}
