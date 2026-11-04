import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { apiRequest } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";
import type { BlogPage } from "@/types/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  ];
  const authors = new Set<string>();

  for (let page = 0; page < 1000; page += 1) {
    const result = await apiRequest<BlogPage>(
      `/blog?page=${page}&size=50&order=newest`,
    );

    for (const story of result.content) {
      authors.add(story.creatorUsername);
      entries.push({
        url: `${SITE_URL}/blog/${encodeURIComponent(story.slug)}`,
        lastModified: story.updatedAt || story.createdAt,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
    if (result.last || result.content.length === 0) break;
  }

  for (const username of authors) {
    entries.push({
      url: `${SITE_URL}/author/${encodeURIComponent(username)}`,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
