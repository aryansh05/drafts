package com.drafts.backend.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select token from RefreshToken token where token.tokenHash = :tokenHash")
  Optional<RefreshToken> findForUpdate(@Param("tokenHash") String tokenHash);

  void deleteByTokenHash(String tokenHash);

  @Modifying
  @Query("delete from RefreshToken token where token.user.id = :userId")
  void deleteAllForUser(@Param("userId") UUID userId);
}
