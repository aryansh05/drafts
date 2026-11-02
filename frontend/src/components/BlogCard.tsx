import { Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import BlogLikeButton from "@/components/BlogLikeButton";
import { getReadingMinutes } from "@/lib/content";
import type { Blog } from "@/types/blog";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string): string {
  return name
    .split(/[._\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none">
      <Link href={`/blog/${encodeURIComponent(blog.slug)}`} className="block">
        <div className="relative h-52 overflow-hidden bg-slate-100">
          {blog.imageUrl ? (
            <Image
              fill
              unoptimized
              src={blog.imageUrl}
              alt={blog.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="editorial-serif text-5xl font-normal text-slate-400">
                {getInitials(blog.title)}
              </span>
            </div>
          )}
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <time dateTime={blog.createdAt}>{formatDate(blog.createdAt)}</time>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} /> {getReadingMinutes(blog.content)} min read
            </span>
          </div>
          <h2 className="editorial-serif mt-2 line-clamp-2 text-2xl font-normal leading-snug text-slate-900 group-hover:text-blue-700">
            {blog.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {blog.disc}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2 px-5 pb-2 text-xs font-medium text-slate-500">
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
          {blog.creatorProfileImageUrl ? (
            <Image
              src={blog.creatorProfileImageUrl}
              alt=""
              fill
              unoptimized
              sizes="28px"
              className="object-cover"
            />
          ) : (
            blog.creatorUsername.slice(0, 2).toUpperCase()
          )}
        </span>
        <span>
          {"By "}
          <Link
            href={`/author/${encodeURIComponent(blog.creatorUsername)}`}
            className="text-slate-700 hover:text-blue-700"
          >
            {blog.creatorUsername}
          </Link>
        </span>
      </div>
      <div className="px-3 pb-2">
        <BlogLikeButton
          blogId={blog.id}
          initialCount={blog.likeCount}
          initiallyLiked={blog.likedByCurrentUser}
        />
      </div>
    </article>
  );
}
