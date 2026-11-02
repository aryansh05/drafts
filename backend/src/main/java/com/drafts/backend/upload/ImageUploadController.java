package com.drafts.backend.upload;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class ImageUploadController {

  @Value("${app.cloudinary.cloud-name}")
  private String cloudName;

  @Value("${app.cloudinary.api-key}")
  private String apiKey;

  @Value("${app.cloudinary.api-secret}")
  private String apiSecret;

  @Value("${app.cloudinary.upload-preset}")
  private String uploadPreset;

  @PostMapping("/signature")
  public CloudinaryUploadSignature createSignature(@AuthenticationPrincipal Jwt jwt) {
    long timestamp = Instant.now().getEpochSecond();
    String folder = "drafts/" + jwt.getSubject();
    Map<String, String> parameters = new TreeMap<>();
    parameters.put("folder", folder);
    parameters.put("timestamp", Long.toString(timestamp));
    parameters.put("upload_preset", uploadPreset);
    parameters.put("allowed_formats", "jpg,png");
    return new CloudinaryUploadSignature(
        cloudName,
        apiKey,
        folder,
        uploadPreset,
        "jpg,png",
        timestamp,
        sign(parameters));
  }

  private String sign(Map<String, String> parameters) {
    String canonical = parameters.entrySet().stream()
        .map(entry -> entry.getKey() + "=" + entry.getValue())
        .reduce((left, right) -> left + "&" + right)
        .orElse("");
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-1");
      byte[] signature = digest.digest((canonical + apiSecret).getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(signature);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-1 is not available", exception);
    }
  }
}
