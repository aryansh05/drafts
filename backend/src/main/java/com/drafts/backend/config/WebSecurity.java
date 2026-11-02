package com.drafts.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.http.HttpMethod;

@Configuration
@EnableMethodSecurity
public class WebSecurity {

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    var authenticationconv = new JwtGrantedAuthoritiesConverter();
    authenticationconv.setAuthoritiesClaimName("roles");
    authenticationconv.setAuthorityPrefix("ROLE_");

    var converter = new JwtAuthenticationConverter();

    converter.setJwtGrantedAuthoritiesConverter(authenticationconv);
    return converter;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public BearerTokenResolver bearerTokenResolver() {
    DefaultBearerTokenResolver headerResolver = new DefaultBearerTokenResolver();
    return request -> {
      if (request.getCookies() != null) {
        for (var cookie : request.getCookies()) {
          if (cookie.getName().equals(com.drafts.backend.auth.AuthCookieService.ACCESS_COOKIE)
              && cookie.getValue() != null && !cookie.getValue().isBlank()) {
            return cookie.getValue();
          }
        }
      }
      return headerResolver.resolve(request);
    };
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
      throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigurationSource))
        .csrf(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .addFilterBefore(new CookieCsrfFilter(), BearerTokenAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/", "/actuator/health", "/api/auth/csrf", "/api/auth/login",
                "/api/auth/register", "/api/auth/refresh", "/api/auth/logout")
            .permitAll()
            .requestMatchers(
                "/v3/api-docs/**",
                "/v3/api-docs.yaml",
                "/swagger-ui/**",
                "/swagger-ui.html")
            .permitAll()
            .requestMatchers("/api/auth/me").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/uploads/signature").authenticated()
            .requestMatchers("/api/users/me/**").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/blog/creator/**").permitAll()
            .requestMatchers("/api/blog/mine", "/api/blog/mine/**").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/blog/likes").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/blog/*/comments", "/api/blog/*/comments/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/blogs/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/blog/**").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2
            .bearerTokenResolver(bearerTokenResolver())
            .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

    return http.build();
  }

}
