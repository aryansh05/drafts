import Link from "next/link";
import BlogLikeProvider from "@/components/BlogLikeProvider";
import { apiRequest } from "@/lib/api";
import type { BlogPage } from "@/types/blog";
import { BlogCard } from "./BlogCard";

const PAGE_SIZE = 9;

type BlogFeedProps = {
  searchParams: Promise<{ page?: string; q?: string; order?: string }>;
};

export default async function BlogFeed({ searchParams }: BlogFeedProps) {
  const param = await searchParams;
  const currPage = Math.max(0, Number(param.page ?? "0") || 0);
  const query = param.q?.trim() ?? "";
  const order = ["popular", "newest", "oldest", "title"].includes(
    param.order ?? "",
  )
    ? (param.order as string)
    : "popular";

  let data: BlogPage | null = null;
  try {
    data = await apiRequest<BlogPage>(
      `/blog?page=${currPage}&size=${PAGE_SIZE}&q=${encodeURIComponent(query)}&order=${order}`,
    );
  } catch {
    data = null;
  }

  const blogs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const queryParams = new URLSearchParams();
  if (query) queryParams.set("q", query);
  if (order !== "popular") queryParams.set("order", order);
  const queryString = queryParams.toString();

  return (
    <section className="mx-auto max-w-7xl px-0 py-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <h2 className="editorial-serif text-3xl font-normal text-slate-900">
          {query
            ? `Stories matching “${query}”`
            : order === "popular"
              ? "Most liked"
              : "The latest"}
        </h2>
        <span className="text-sm text-slate-500">
          {data
            ? `${data.totalElements} stories`
            : "Stories are temporarily unavailable"}
        </span>
      </div>
      <nav
        className="mb-8 flex flex-wrap items-center gap-3"
        aria-label="Sort stories"
      >
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sort
        </span>
        {[
          ["popular", "Most liked"],
          ["newest", "Newest"],
          ["oldest", "Oldest"],
          ["title", "Title A–Z"],
        ].map(([value, label]) => {
          const params = new URLSearchParams(queryParams);
          if (value === "popular") params.delete("order");
          else params.set("order", value);
          const href = params.size ? `/?${params.toString()}` : "/";
          return (
            <Link
              key={value}
              href={href}
              aria-current={order === value ? "page" : undefined}
              className={`border-b px-1 py-1.5 text-sm font-medium ${order === value ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {data === null ? (
        <div className="border-y border-slate-200 bg-white px-6 py-12 text-center">
          <h3 className="editorial-serif text-2xl font-normal text-slate-900">
            Stories could not load
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Check the API connection and try again.
          </p>
          <Link
            href={queryString ? `/?${queryString}` : "/"}
            className="mt-4 inline-block font-semibold text-blue-700 underline"
          >
            Try again
          </Link>
        </div>
      ) : blogs.length === 0 ? (
        <div className="border-y border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="editorial-serif text-xl text-slate-600">
            {query
              ? "No stories match your search. Try another phrase."
              : "No published stories yet. Be the first to share one."}
          </p>
          {query && (
            <Link
              href="/"
              className="mt-3 inline-block text-sm font-semibold text-blue-700"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <>
          <BlogLikeProvider blogIds={blogs.map((blog) => blog.id)}>
            <div className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          </BlogLikeProvider>
          {totalPages > 1 && (
            <nav
              aria-label="Blog pagination"
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link
                href={`/?page=${currPage - 1}${queryString ? `&${queryString}` : ""}`}
                className={`rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ${currPage === 0 ? "pointer-events-none opacity-40" : ""}`}
              >
                Previous
              </Link>
              <span className="text-sm text-slate-500">
                Page {currPage + 1} of {totalPages}
              </span>
              <Link
                href={`/?page=${currPage + 1}${queryString ? `&${queryString}` : ""}`}
                className={`rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white ${currPage >= totalPages - 1 ? "pointer-events-none opacity-40" : ""}`}
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
