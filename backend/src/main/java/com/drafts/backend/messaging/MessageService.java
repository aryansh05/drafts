package com.drafts.backend.messaging;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.drafts.backend.messaging.dto.ConversationSummary;
import com.drafts.backend.messaging.dto.MessageResponse;
import com.drafts.backend.messaging.dto.MessageThreadResponse;
import com.drafts.backend.messaging.dto.SendMessageRequest;
import com.drafts.backend.messaging.dto.StartConversationRequest;
import com.drafts.backend.user.User;
import com.drafts.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageService {
  private final ConversationRepository conversationRepository;
  private final DirectMessageRepository messageRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<ConversationSummary> inbox(String username) {
    User currentUser = findUser(username);
    return conversationRepository.findForUser(currentUser.getId()).stream().map(conversation -> {
      User other = otherParticipant(conversation, currentUser.getId());
      DirectMessage latest = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId());
      long unread = messageRepository.countByConversationIdAndSenderIdNotAndReadAtIsNull(
          conversation.getId(), currentUser.getId());
      return new ConversationSummary(
          conversation.getId(),
          other.getId(),
          other.getUsername(),
          latest == null ? "" : latest.getContent(),
          conversation.getUpdatedAt(),
          unread);
    }).toList();
  }

  @Transactional
  public MessageThreadResponse open(UUID conversationId, String username) {
    User currentUser = findUser(username);
    Conversation conversation = requireParticipant(conversationId, currentUser.getId());
    messageRepository.markReceivedAsRead(conversation.getId(), currentUser.getId(), Instant.now());
    return toThread(conversation, currentUser.getId());
  }

  @Transactional
  public MessageThreadResponse start(StartConversationRequest request, String username) {
    User currentUser = findUser(username);
    User recipient = userRepository.findByUsername(request.recipientUsername().trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));
    if (currentUser.getId().equals(recipient.getId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot message yourself");
    }

    User first = currentUser.getId().compareTo(recipient.getId()) < 0 ? currentUser : recipient;
    User second = first == currentUser ? recipient : currentUser;
    Conversation conversation = conversationRepository
        .findByParticipantAIdAndParticipantBId(first.getId(), second.getId())
        .orElseGet(() -> {
          Conversation created = new Conversation();
          created.setParticipantA(first);
          created.setParticipantB(second);
          return conversationRepository.save(created);
        });
    send(conversation, currentUser, request.content());
    return toThread(conversation, currentUser.getId());
  }

  @Transactional
  public MessageResponse send(UUID conversationId, SendMessageRequest request, String username) {
    User currentUser = findUser(username);
    Conversation conversation = requireParticipant(conversationId, currentUser.getId());
    return toResponse(send(conversation, currentUser, request.content()));
  }

  private DirectMessage send(Conversation conversation, User sender, String content) {
    DirectMessage message = new DirectMessage();
    message.setConversation(conversation);
    message.setSender(sender);
    message.setContent(content.trim());
    conversation.setUpdatedAt(Instant.now());
    conversationRepository.save(conversation);
    return messageRepository.save(message);
  }

  private MessageThreadResponse toThread(Conversation conversation, UUID currentUserId) {
    User other = otherParticipant(conversation, currentUserId);
    List<MessageResponse> messages = messageRepository
        .findByConversationIdOrderByCreatedAtAsc(conversation.getId())
        .stream().map(this::toResponse).toList();
    return new MessageThreadResponse(conversation.getId(), other.getId(), other.getUsername(), messages);
  }

  private MessageResponse toResponse(DirectMessage message) {
    return new MessageResponse(
        message.getId(),
        message.getSender().getId(),
        message.getSender().getUsername(),
        message.getContent(),
        message.getCreatedAt(),
        message.getReadAt());
  }

  private Conversation requireParticipant(UUID conversationId, UUID userId) {
    Conversation conversation = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    if (!conversation.getParticipantA().getId().equals(userId)
        && !conversation.getParticipantB().getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found");
    }
    return conversation;
  }

  private User otherParticipant(Conversation conversation, UUID userId) {
    return conversation.getParticipantA().getId().equals(userId)
        ? conversation.getParticipantB()
        : conversation.getParticipantA();
  }

  private User findUser(String username) {
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to use messages"));
  }
}
