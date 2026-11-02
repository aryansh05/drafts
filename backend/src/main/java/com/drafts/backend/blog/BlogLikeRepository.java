package com.drafts.backend.blog;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlogLikeRepository extends JpaRepository<BlogLike, UUID> {
  void deleteByBlogId(UUID blogId);

  @Query("select l.blog.id from BlogLike l where l.user.id = :userId and l.blog.id in :blogIds")
  List<UUID> findLikedBlogIds(
      @Param("userId") UUID userId,
      @Param("blogIds") Collection<UUID> blogIds);

  boolean existsByBlogIdAndUserId(UUID blogId, UUID userId);

  long deleteByBlogIdAndUserId(UUID blogId, UUID userId);
}
