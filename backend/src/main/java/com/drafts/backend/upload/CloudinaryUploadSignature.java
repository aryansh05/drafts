package com.drafts.backend.upload;

public record CloudinaryUploadSignature(
    String cloudName,
    String apiKey,
    String folder,
    String uploadPreset,
    String allowedFormats,
    long timestamp,
    String signature) {
}
