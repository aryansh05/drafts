const API_URL = (
  typeof window === "undefined"
    ? process.env.API_SERVER_URL || "http://localhost:8080/api"
    : "/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = RequestInit & { retryAuth?: boolean };

let refreshPromise: Promise<boolean> | null = null;
let csrfPromise: Promise<string> | null = null;

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("drafts_csrf="));
  return entry ? decodeURIComponent(entry.slice("drafts_csrf=".length)) : null;
}

async function getCsrfToken(): Promise<string> {
  const existing = readCsrfCookie();
  if (existing) return existing;
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_URL}/auth/csrf`, {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new ApiError(
            "Unable to initialize your session.",
            response.status,
          );
        const payload = (await response.json()) as { token: string };
        return payload.token;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "X-CSRF-TOKEN": csrfToken },
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          const { clearSession } = await import("@/lib/session");
          clearSession();
          return false;
        }
        const session =
          (await response.json()) as import("@/types/auth").AuthResponse;
        const { saveSession } = await import("@/lib/session");
        saveSession(session);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function isMutation(method?: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes((method ?? "GET").toUpperCase());
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { headers: initialHeaders, retryAuth, ...requestOptions } = options;
  const isFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  const headers = new Headers(initialHeaders);

  if (
    !isFormData &&
    requestOptions.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined" && isMutation(requestOptions.method)) {
    headers.set("X-CSRF-TOKEN", await getCsrfToken());
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...requestOptions,
      headers,
      credentials: typeof window === "undefined" ? "omit" : "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "The Drafts API could not be reached. Check that the backend is running and the server API URL is configured.",
      0,
    );
  }

  if (!response.ok) {
    let sessionExpired = false;
    const isAuthEndpoint = endpoint.startsWith("/auth/");
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !retryAuth &&
      !isAuthEndpoint
    ) {
      if (await refreshSession()) {
        return apiRequest<T>(endpoint, { ...options, retryAuth: true });
      }
      const { clearSession } = await import("@/lib/session");
      clearSession();
      sessionExpired = true;
    }
    const msg = await response.text();
    let message = msg;
    try {
      const parsed = JSON.parse(msg) as {
        detail?: string;
        message?: string;
        error?: string;
      };
      message =
        parsed.detail ||
        parsed.message ||
        (parsed.error ? `Request failed: ${parsed.error}` : "") ||
        `Request failed (${response.status}).`;
    } catch {}
    throw new ApiError(
      sessionExpired
        ? "Your session expired. Sign in again to continue."
        : message || `Request failed (${response.status}).`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
