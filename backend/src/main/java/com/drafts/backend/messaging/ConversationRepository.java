package com.drafts.backend.messaging;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
  Optional<Conversation> findByParticipantAIdAndParticipantBId(UUID participantAId, UUID participantBId);

  @EntityGraph(attributePaths = { "participantA", "participantB" })
  @Query("select c from Conversation c where c.participantA.id = :userId or c.participantB.id = :userId order by c.updatedAt desc")
  List<Conversation> findForUser(@Param("userId") UUID userId);
}
