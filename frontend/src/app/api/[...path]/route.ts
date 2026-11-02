import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const API_URL = (
  process.env.API_SERVER_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const BLOCKED_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
]);

function sameToken(left: string, right: string): boolean {
  if (left.length !== 43 || right.length !== 43) return false;
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return new Response("Cross-origin request rejected.", { status: 403 });
    }
    const cookieToken = request.cookies.get("drafts_csrf")?.value ?? "";
    const headerToken = request.headers.get("x-csrf-token") ?? "";
    if (!cookieToken || !headerToken || !sameToken(cookieToken, headerToken)) {
      return new Response("CSRF validation failed.", { status: 403 });
    }
  }

  const { path } = await context.params;
  const endpoint = path.map((segment) => encodeURIComponent(segment)).join("/");
  const upstreamUrl = `${API_URL}/${endpoint}${new URL(request.url).search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!BLOCKED_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  let upstream: Response;
  try {
    const upstreamOptions = {
      method: request.method,
      headers,
      body: SAFE_METHODS.has(request.method) ? undefined : request.body,
      cache: "no-store",
      duplex: "half",
    } as RequestInit;
    upstream = await fetch(upstreamUrl, upstreamOptions);
  } catch {
    return new Response("The Drafts API could not be reached.", {
      status: 502,
    });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (
      !BLOCKED_HEADERS.has(key.toLowerCase()) &&
      key.toLowerCase() !== "content-encoding" &&
      key.toLowerCase() !== "set-cookie"
    ) {
      responseHeaders.set(key, value);
    }
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
