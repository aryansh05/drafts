package com.drafts.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import jakarta.servlet.http.Cookie;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
class BackendApplicationTests {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JsonMapper jsonMapper;

  @Test
  void authorCanCreateManagePublishAndSearchAStory() throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    String username = "writer" + suffix;
    String email = username + "@example.com";

    MvcResult registration = mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"%s","email":"%s","password":"correct-horse-123"}
                """.formatted(username, email)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.accessToken").doesNotExist())
        .andExpect(jsonPath("$.refreshToken").doesNotExist())
        .andReturn();
    String token = registration.getResponse().getCookie("drafts_access").getValue();
    org.junit.jupiter.api.Assertions.assertTrue(
        registration.getResponse().getCookie("drafts_access").isHttpOnly());
    org.junit.jupiter.api.Assertions.assertTrue(
        registration.getResponse().getCookie("drafts_refresh").isHttpOnly());
    org.junit.jupiter.api.Assertions.assertTrue(
        registration.getResponse().getCookie("drafts_access").getSecure());
    mockMvc.perform(post("/api/blog")
            .cookie(registration.getResponse().getCookie("drafts_access"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"title":"Blocked without CSRF","disc":"csrf test","content":"<p>test</p>"}
                """))
        .andExpect(status().isForbidden());
    mockMvc.perform(get("/api/auth/me").cookie(registration.getResponse().getCookie("drafts_access")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(username));

    MvcResult created = mockMvc.perform(post("/api/blog")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"title":"Searchable story %s","disc":"A description for search testing","content":"<p>needleword article body</p>"}
                """.formatted(suffix)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.publish").value(false))
        .andReturn();

    JsonNode story = jsonMapper.readTree(created.getResponse().getContentAsString());
    String storyId = story.get("id").stringValue();

    mockMvc.perform(get("/api/blog/mine")
            .header("Authorization", "Bearer " + token)
            .param("q", "needleword")
            .param("status", "drafts"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].id").value(storyId));

    mockMvc.perform(get("/api/blog/mine/stats").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.drafts").value(1));

    mockMvc.perform(patch("/api/blog/" + storyId + "/publish")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.publish").value(true));

    mockMvc.perform(put("/api/users/me/profile-image")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"profileImageUrl":"https://res.cloudinary.com/drafts/image/upload/profile.png"}
                """))
        .andExpect(status().isOk());

    String slug = story.get("slug").stringValue();
    mockMvc.perform(get("/api/blog/" + slug + "/comments"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(0));
    mockMvc.perform(post("/api/blog/" + slug + "/comments")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"content":"A useful comment"}
                """))
        .andExpect(status().isUnauthorized());

    MvcResult commentResult = mockMvc.perform(post("/api/blog/" + slug + "/comments")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"content":"A useful comment"}
                """))
        .andExpect(status().isCreated())
        .andReturn();
    String commentId = jsonMapper.readTree(commentResult.getResponse().getContentAsString())
        .get("id").stringValue();
    mockMvc.perform(post("/api/blog/" + slug + "/comments/" + commentId + "/replies")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"content":"Thanks for reading"}
                """))
        .andExpect(status().isCreated());
    mockMvc.perform(get("/api/blog/" + slug + "/comments"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].creatorImageUrl")
            .value("https://res.cloudinary.com/drafts/image/upload/profile.png"))
        .andExpect(jsonPath("$.content[0].replies[0].content").value("Thanks for reading"))
        .andExpect(jsonPath("$.content[0].replies[0].creatorImageUrl")
            .value("https://res.cloudinary.com/drafts/image/upload/profile.png"));

    mockMvc.perform(put("/api/blog/" + storyId + "/like")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"liked":true}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.likeCount").value(1))
        .andExpect(jsonPath("$.liked").value(true));
    mockMvc.perform(put("/api/blog/" + storyId + "/like")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"liked":true}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.likeCount").value(1));
    mockMvc.perform(put("/api/blog/" + storyId + "/like")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"liked":false}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.likeCount").value(0))
        .andExpect(jsonPath("$.liked").value(false));

    mockMvc.perform(get("/api/blog").param("q", "needleword"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].creatorUsername").value(username));

    mockMvc.perform(get("/api/blog/creator/" + username))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].creatorUsername").value(username));

    mockMvc.perform(get("/api/blog").param("q", "%"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(0));

    mockMvc.perform(get("/api/blog/mine/" + storyId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(storyId));

    mockMvc.perform(put("/api/blog/" + storyId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"title":"Edited story %s","disc":"Updated search description","content":"<p>updatedneedle article body</p>"}
                """.formatted(suffix)))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.title").value("Edited story " + suffix));

    mockMvc.perform(get("/api/blog/mine/stats"))
        .andExpect(status().isUnauthorized());

    MvcResult strangerRegistration = mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"reader%s","email":"reader%s@example.com","password":"correct-horse-123"}
                """.formatted(suffix, suffix)))
        .andExpect(status().isCreated())
        .andReturn();
    String strangerToken = strangerRegistration.getResponse().getCookie("drafts_access").getValue();

    mockMvc.perform(get("/api/blog/mine/" + storyId)
            .header("Authorization", "Bearer " + strangerToken))
        .andExpect(status().isNotFound());

    mockMvc.perform(delete("/api/blog/" + storyId).header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/blog").param("q", "updatedneedle"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(0));
  }

  @Test
  void accountSettingsUpdateProfileAndPasswordWithoutLosingSession() throws Exception {
    String username = "settings" + UUID.randomUUID().toString().substring(0, 8);
    String password = "correct-horse-123";
    MvcResult registered = mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"%s","email":"%s@example.com","password":"%s"}
                """.formatted(username, username, password)))
        .andExpect(status().isCreated())
        .andReturn();
    JsonNode registration = jsonMapper.readTree(registered.getResponse().getContentAsString());
    String token = registered.getResponse().getCookie("drafts_access").getValue();
    String initialRefreshToken = registered.getResponse().getCookie("drafts_refresh").getValue();

    mockMvc.perform(put("/api/users/me/profile-image")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"profileImageUrl":"https://example.com/profile.png"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/profile.png"));

    String updatedUsername = username + "edited";
    MvcResult accountUpdate = mockMvc.perform(put("/api/users/me/account")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"%s","email":"%s@example.com","currentPassword":"%s"}
                """.formatted(updatedUsername, updatedUsername, password)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(updatedUsername))
        .andExpect(jsonPath("$.email").value(updatedUsername + "@example.com"))
        .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/profile.png"))
        .andReturn();
    String accountToken = accountUpdate.getResponse().getCookie("drafts_access").getValue();
    String accountRefreshToken = accountUpdate.getResponse().getCookie("drafts_refresh").getValue();
    String csrfToken = accountUpdate.getResponse().getCookie("drafts_csrf").getValue();

    mockMvc.perform(get("/api/users/" + updatedUsername))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/profile.png"));
    mockMvc.perform(post("/api/auth/refresh")
            .cookie(new Cookie("drafts_refresh", initialRefreshToken))
            .cookie(new Cookie("drafts_csrf", csrfToken))
            .header("X-CSRF-TOKEN", csrfToken))
        .andExpect(status().isUnauthorized());

    MvcResult passwordUpdate = mockMvc.perform(put("/api/users/me/password")
            .header("Authorization", "Bearer " + accountToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"currentPassword":"%s","newPassword":"updated-password-456"}
                """.formatted(password)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(updatedUsername))
        .andReturn();
    String passwordToken = passwordUpdate.getResponse().getCookie("drafts_access").getValue();

    mockMvc.perform(get("/api/blog/mine").header("Authorization", "Bearer " + passwordToken))
        .andExpect(status().isOk());
    mockMvc.perform(post("/api/auth/refresh")
            .cookie(new Cookie("drafts_refresh", accountRefreshToken))
            .cookie(new Cookie("drafts_csrf", csrfToken))
            .header("X-CSRF-TOKEN", csrfToken))
        .andExpect(status().isUnauthorized());
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"%s","password":"updated-password-456"}
                """.formatted(updatedUsername)))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.username").value(updatedUsername));
  }

  @Test
  void writersCanMessageAndReadAnInboxThread() throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    String senderName = "sender" + suffix;
    String recipientName = "recipient" + suffix;
    String senderToken = registerAndGetToken(senderName);
    String recipientToken = registerAndGetToken(recipientName);

    MvcResult started = mockMvc.perform(post("/api/messages/conversations")
            .header("Authorization", "Bearer " + senderToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"recipientUsername":"%s","content":"Hello from Drafts"}
                """.formatted(recipientName)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.messages[0].content").value("Hello from Drafts"))
        .andReturn();
    String conversationId = jsonMapper.readTree(started.getResponse().getContentAsString())
        .get("conversationId").stringValue();

    mockMvc.perform(get("/api/messages").header("Authorization", "Bearer " + recipientToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].unreadCount").value(1));
    mockMvc.perform(get("/api/messages/" + conversationId)
            .header("Authorization", "Bearer " + recipientToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.messages[0].readAt").isNotEmpty());
    mockMvc.perform(post("/api/messages/" + conversationId)
            .header("Authorization", "Bearer " + recipientToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"content":"Thanks for reaching out"}
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.content").value("Thanks for reaching out"));
    mockMvc.perform(get("/api/messages/" + conversationId)
            .header("Authorization", "Bearer " + senderToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.messages.length()").value(2));
  }

  @Test
  void signedInWritersReceiveScopedCloudinaryUploadSignatures() throws Exception {
    String username = "image" + UUID.randomUUID().toString().substring(0, 8);
    String token = registerAndGetToken(username);
    mockMvc.perform(post("/api/uploads/signature"))
        .andExpect(status().isUnauthorized());
    mockMvc.perform(post("/api/uploads/signature")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cloudName").value("drafts-test"))
        .andExpect(jsonPath("$.uploadPreset").value("drafts-test-preset"))
        .andExpect(jsonPath("$.allowedFormats").value("jpg,png"))
        .andExpect(jsonPath("$.folder").value(org.hamcrest.Matchers.startsWith("drafts/")))
        .andExpect(jsonPath("$.timestamp").isNumber())
        .andExpect(jsonPath("$.signature").value(org.hamcrest.Matchers.matchesRegex("[a-f0-9]{40}")));
  }

  private String registerAndGetToken(String username) throws Exception {
    MvcResult registration = mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"%s","email":"%s@example.com","password":"correct-horse-123"}
                """.formatted(username, username)))
        .andExpect(status().isCreated())
        .andReturn();
    return registration.getResponse().getCookie("drafts_access").getValue();
  }
}
