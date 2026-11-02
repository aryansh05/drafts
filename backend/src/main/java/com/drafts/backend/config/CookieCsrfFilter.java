package com.drafts.backend.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.web.filter.OncePerRequestFilter;

import com.drafts.backend.auth.AuthCookieService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public class CookieCsrfFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    String method = request.getMethod();
    boolean mutation = !method.equals("GET") && !method.equals("HEAD") && !method.equals("OPTIONS");
    if (mutation && request.getRequestURI().startsWith("/api/")) {
      String cookieToken = cookieValue(request, AuthCookieService.CSRF_COOKIE);
      boolean hasSessionCookie = cookieValue(request, AuthCookieService.ACCESS_COOKIE) != null
          || cookieValue(request, AuthCookieService.REFRESH_COOKIE) != null;
      if ((hasSessionCookie || cookieToken != null)
          && !matches(cookieToken, request.getHeader("X-CSRF-TOKEN"))) {
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "CSRF validation failed");
        return;
      }
    }
    filterChain.doFilter(request, response);
  }

  private String cookieValue(HttpServletRequest request, String name) {
    if (request.getCookies() == null) return null;
    for (var cookie : request.getCookies()) {
      if (cookie.getName().equals(name)) return cookie.getValue();
    }
    return null;
  }

  private boolean matches(String cookieToken, String headerToken) {
    if (cookieToken == null || headerToken == null
        || cookieToken.length() != 43 || headerToken.length() != 43) return false;
    byte[] cookieBytes = cookieToken.getBytes(StandardCharsets.UTF_8);
    byte[] headerBytes = headerToken.getBytes(StandardCharsets.UTF_8);
    return cookieBytes.length == headerBytes.length && MessageDigest.isEqual(cookieBytes, headerBytes);
  }
}
