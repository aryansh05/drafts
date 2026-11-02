# Drafts frontend

Next.js 16 App Router frontend for the Drafts blogging application. See the
project root README for local development and deployment instructions.

Set `API_SERVER_URL` at runtime to the backend API address reachable by the
frontend server. Browser requests use the same-origin `/api` route, which
forwards HttpOnly session cookies and enforces CSRF checks. Set
`NEXT_PUBLIC_SITE_URL` before building so canonical metadata and sitemap URLs
use the production origin. Set `SECURE_COOKIES=true` on the backend in HTTPS
deployments.

Run locally with `npm ci` and `npm run dev`.
