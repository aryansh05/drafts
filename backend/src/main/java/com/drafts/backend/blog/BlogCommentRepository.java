package com.drafts.backend.blog;

import java.util.List;
import java.util.Collection;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlogCommentRepository extends JpaRepository<BlogComment, UUID> {
  @EntityGraph(attributePaths = "creator")
  Page<BlogComment> findByBlogIdAndParentCommentIsNull(UUID blogId, Pageable pageable);

  @EntityGraph(attributePaths = "creator")
  @Query("select c from BlogComment c where c.blog.id = :blogId and c.parentComment.id in :parentIds order by c.createdAt asc")
  List<BlogComment> findReplies(
      @Param("blogId") UUID blogId,
      @Param("parentIds") Collection<UUID> parentIds);

  void deleteByBlogIdAndParentCommentIsNotNull(UUID blogId);

  void deleteByBlogIdAndParentCommentIsNull(UUID blogId);
}
