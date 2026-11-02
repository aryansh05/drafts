import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/BlogCard";
import BlogLikeProvider from "@/components/BlogLikeProvider";
import { apiRequest } from "@/lib/api";
import type { PublicProfile } from "@/types/auth";
import type { BlogPage } from "@/types/blog";

export const instant = false;

type AuthorPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(0, Number(query.page ?? "0") || 0);
  let stories: BlogPage;
  let profile: PublicProfile;

  try {
    [stories, profile] = await Promise.all([
      apiRequest<BlogPage>(
        `/blog/creator/${encodeURIComponent(username)}?page=${page}&size=12`,
      ),
      apiRequest<PublicProfile>(`/users/${encodeURIComponent(username)}`),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) notFound();
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="rounded-2xl border border-amber-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Author page unavailable
          </p>
          <h1 className="editorial-serif mt-3 text-3xl text-slate-950">
            We couldn’t load {username}’s stories
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The stories service did not respond as expected. Please try again in
            a moment.
          </p>
          <Link
            href={`/author/${encodeURIComponent(username)}?page=${page}`}
            className="mt-6 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Try again
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-10 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-semibold text-blue-800 ring-4 ring-blue-50 sm:h-24 sm:w-24">
            {profile.profileImageUrl ? (
              <Image
                src={profile.profileImageUrl}
                alt={`${username}'s profile`}
                fill
                unoptimized
                sizes="96px"
                className="object-cover"
              />
            ) : (
              username.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Drafts author
            </p>
            <h1 className="editorial-serif mt-2 text-4xl font-normal text-slate-950 sm:text-5xl">
              {username}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {stories.totalElements} published{" "}
              {stories.totalElements === 1 ? "story" : "stories"}
            </p>
          </div>
        </div>
      </header>

      {stories.empty ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-600">
          This author has no published stories yet.
        </p>
      ) : (
        <>
          <BlogLikeProvider blogIds={stories.content.map((story) => story.id)}>
            <div className="grid grid-cols-1 gap-x-7 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {stories.content.map((story) => (
                <BlogCard key={story.id} blog={story} />
              ))}
            </div>
          </BlogLikeProvider>
          {stories.totalPages > 1 && (
            <nav
              aria-label="Author story pages"
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link
                href={`/author/${encodeURIComponent(username)}?page=${page - 1}`}
                aria-disabled={page === 0}
                className={`rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ${page === 0 ? "pointer-events-none opacity-40" : ""}`}
              >
                Previous
              </Link>
              <span className="text-sm text-slate-500">
                Page {page + 1} of {stories.totalPages}
              </span>
              <Link
                href={`/author/${encodeURIComponent(username)}?page=${page + 1}`}
                aria-disabled={page >= stories.totalPages - 1}
                className={`rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white ${page >= stories.totalPages - 1 ? "pointer-events-none opacity-40" : ""}`}
              >
                Next
              </Link>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
