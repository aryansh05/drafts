import { apiRequest } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function registerRequest(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
