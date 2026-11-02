package com.drafts.backend.blog;

import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogRepository extends JpaRepository<Blog, UUID> {
  Optional<Blog> findBySlug(String slug);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select b from Blog b where b.id = :id")
  Optional<Blog> findForUpdate(@Param("id") UUID id);

  boolean existsBySlug(String slug);

  Page<Blog> findByPublishTrue(Pageable page);

  @Query("select b from Blog b where b.publish = true and " +
      "(:query = '' or lower(b.title) like lower(concat('%', :query, '%')) escape '!' " +
      "or lower(b.disc) like lower(concat('%', :query, '%')) escape '!' " +
      "or lower(b.content) like lower(concat('%', :query, '%')) escape '!' " +
      "or lower(b.creator.username) like lower(concat('%', :query, '%')) escape '!')")
  Page<Blog> searchPublished(@Param("query") String query, Pageable page);

  @Query("select b from Blog b where b.creator.username = :username " +
      "and (:query = '' or lower(b.title) like lower(concat('%', :query, '%')) escape '!' " +
      "or lower(b.disc) like lower(concat('%', :query, '%')) escape '!' " +
      "or lower(b.content) like lower(concat('%', :query, '%')) escape '!') " +
      "and (:status = 'all' or (:status = 'drafts' and b.publish = false) " +
      "or (:status = 'published' and b.publish = true))")
  Page<Blog> searchMine(
      @Param("username") String username,
      @Param("query") String query,
      @Param("status") String status,
      Pageable page);

  Optional<Blog> findByIdAndCreatorUsername(UUID id, String username);

  long countByCreatorUsername(String username);

  long countByCreatorUsernameAndPublishFalse(String username);

  long countByCreatorUsernameAndPublishTrue(String username);
}
