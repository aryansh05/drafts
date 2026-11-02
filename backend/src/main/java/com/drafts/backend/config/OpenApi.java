package com.drafts.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.Contact;

import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(title = "Drafts API", version = "1.0.0", description = "REST API documentation for the Drafts blogging platform", contact = @Contact(name = "Drafts API")))
public class OpenApi {
}
