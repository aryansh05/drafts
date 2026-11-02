import type { AuthResponse } from "@/types/auth";

const AUTH_CHANGED = "drafts:auth-changed";
const LEGACY_SESSION_KEYS = [
  "accessToken",
  "refreshToken",
  "expiresAt",
  "refreshExpiresAt",
  "user",
  "drafts:return-to",
];

export type SessionUser = AuthResponse;

let currentUser: SessionUser | null = null;

if (typeof window !== "undefined") {
  try {
    for (const key of LEGACY_SESSION_KEYS)
      window.sessionStorage.removeItem(key);
  } catch {}
}

export function getSessionUser(): SessionUser | null {
  return currentUser;
}

export function saveSession(user: SessionUser): void {
  currentUser = user;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED));
  }
}

export function clearSession(): void {
  currentUser = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED));
  }
}

export function updateSessionProfileImage(
  profileImageUrl: string | null,
): void {
  if (!currentUser) return;
  currentUser = { ...currentUser, profileImageUrl };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED));
  }
}

export function subscribeToSession(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGED, callback);
  return () => window.removeEventListener(AUTH_CHANGED, callback);
}
