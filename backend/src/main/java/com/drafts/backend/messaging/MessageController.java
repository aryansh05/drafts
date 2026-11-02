package com.drafts.backend.messaging;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.drafts.backend.messaging.dto.ConversationSummary;
import com.drafts.backend.messaging.dto.MessageResponse;
import com.drafts.backend.messaging.dto.MessageThreadResponse;
import com.drafts.backend.messaging.dto.SendMessageRequest;
import com.drafts.backend.messaging.dto.StartConversationRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
  private final MessageService messageService;

  @GetMapping
  public List<ConversationSummary> inbox(Authentication authentication) {
    return messageService.inbox(authentication.getName());
  }

  @PostMapping("/conversations")
  public ResponseEntity<MessageThreadResponse> start(
      @Valid @RequestBody StartConversationRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(messageService.start(request, authentication.getName()));
  }

  @GetMapping("/{conversationId}")
  public MessageThreadResponse open(
      @PathVariable UUID conversationId,
      Authentication authentication) {
    return messageService.open(conversationId, authentication.getName());
  }

  @PostMapping("/{conversationId}")
  public ResponseEntity<MessageResponse> send(
      @PathVariable UUID conversationId,
      @Valid @RequestBody SendMessageRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(messageService.send(conversationId, request, authentication.getName()));
  }
}
