import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog/", "/author/"],
      disallow: [
        "/api/",
        "/blog/create",
        "/blog/edit/",
        "/inbox",
        "/login",
        "/my-drafts",
        "/settings",
        "/signup",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
