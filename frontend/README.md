# Drafts frontend

Next.js 16 App Router frontend for the Drafts blogging application. See the
project root README for local development and deployment instructions.

Set `API_SERVER_URL` at runtime to the backend API address reachable by the
frontend server. Browser requests use the same-origin `/api` route, which
forwards HttpOnly session cookies and enforces CSRF checks. Set
`NEXT_PUBLIC_SITE_URL` before building so canonical metadata and sitemap URLs
use the production origin. Set `SECURE_COOKIES=true` on the backend in HTTPS
deployments.

Set `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` in `frontend/.env` for local development
and in the Vercel frontend project environment before building. Create the key
in Web3Forms for the inbox that should receive contact form submissions. The key
is designed for browser use and is sent directly from the contact form to
`https://api.web3forms.com/submit`.

Run locally with `npm ci` and `npm run dev`.
