package com.drafts.backend.messaging;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {
  List<DirectMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

  DirectMessage findTopByConversationIdOrderByCreatedAtDesc(UUID conversationId);

  long countByConversationIdAndSenderIdNotAndReadAtIsNull(UUID conversationId, UUID userId);

  @Modifying
  @Query("update DirectMessage m set m.readAt = :readAt where m.conversation.id = :conversationId and m.sender.id <> :userId and m.readAt is null")
  int markReceivedAsRead(
      @Param("conversationId") UUID conversationId,
      @Param("userId") UUID userId,
      @Param("readAt") Instant readAt);
}
