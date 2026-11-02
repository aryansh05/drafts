"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AppModal from "@/components/AppModal";
import { ApiError, apiRequest } from "@/lib/api";
import type { Blog, BlogPage } from "@/types/blog";

type BlogStats = { total: number; drafts: number; published: number };
type Status = "all" | "drafts" | "published";
const PAGE_SIZE = 15;

export default function MyDraftsPage() {
  const router = useRouter();
  const [data, setData] = useState<BlogPage | null>(null);
  const [stats, setStats] = useState<BlogStats>({
    total: 0,
    drafts: 0,
    published: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [page, setPage] = useState(0);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Blog | null>(null);
  const blogs = data?.content ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, summary] = await Promise.all([
        apiRequest<BlogPage>(
          `/blog/mine?page=${page}&size=${PAGE_SIZE}&q=${encodeURIComponent(query)}&status=${status}&order=updated`,
        ),
        apiRequest<BlogStats>("/blog/mine/stats"),
      ]);
      setData(result);
      setStats(summary);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Unable to load your stories.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, query, router, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);
      setQuery(search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish(blog: Blog) {
    setWorkingId(blog.id);
    setError("");
    try {
      await apiRequest(`/blog/${blog.id}/publish`, { method: "PATCH" });
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401)
        return router.replace("/login");
      setError(
        err instanceof Error ? err.message : "Unable to publish this story.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function remove(blog: Blog) {
    setWorkingId(blog.id);
    setError("");
    try {
      await apiRequest(`/blog/${blog.id}`, { method: "DELETE" });
      if (blogs.length === 1 && page > 0) setPage((current) => current - 1);
      else await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401)
        return router.replace("/login");
      setError(
        err instanceof Error ? err.message : "Unable to delete this story.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const blog = pendingDelete;
    setPendingDelete(null);
    void remove(blog);
  }

  return (
    <main className="mx-auto max-w-6xl px-2 py-8 sm:px-4">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-blue-600">
            YOUR WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My stories
          </h1>
          <p className="mt-2 text-slate-500">
            Write, refine, and share your work.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>
          <Link
            href="/blog/create"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Write a story
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["All stories", stats.total],
          ["Drafts", stats.drafts],
          ["Published", stats.published],
        ].map(([label, count]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{count}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search your stories</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles and descriptions"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </label>
          <fieldset className="flex gap-2">
            <legend className="sr-only">Filter stories by status</legend>
            {(["all", "drafts", "published"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value);
                  setPage(0);
                }}
                className={`rounded-full px-3 py-2 text-sm font-medium capitalize ${status === value ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
              >
                {value}
              </button>
            ))}
          </fieldset>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <section
            className="space-y-3"
            aria-label="Loading stories"
            aria-busy="true"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </section>
        ) : blogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-5 py-14 text-center">
            <h2 className="text-lg font-semibold text-slate-800">
              {query || status !== "all"
                ? "No stories match these filters"
                : "Your first story starts here"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {query || status !== "all"
                ? "Try a different search or status filter."
                : "Create a draft, then publish it whenever you’re ready."}
            </p>
            {!query && status === "all" && (
              <Link
                href="/blog/create"
                className="mt-5 inline-block font-semibold text-blue-600"
              >
                Create a story →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${blog.publish ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {blog.publish ? "Published" : "Draft"}
                    </span>
                    <time
                      dateTime={blog.updatedAt}
                      className="text-xs text-slate-400"
                    >
                      Updated{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(blog.updatedAt))}
                    </time>
                  </div>
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {blog.title}
                  </h2>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {blog.disc}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/blog/edit/${blog.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  {!blog.publish ? (
                    <button
                      type="button"
                      disabled={workingId === blog.id}
                      onClick={() => void publish(blog)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {workingId === blog.id ? "Working…" : "Publish"}
                    </button>
                  ) : (
                    <Link
                      href={`/blog/${encodeURIComponent(blog.slug)}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={workingId === blog.id}
                    onClick={() => setPendingDelete(blog)}
                    aria-label={`Delete ${blog.title}`}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <nav
            aria-label="My stories pages"
            className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"
          >
            <button
              type="button"
              disabled={data.first || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {data.number + 1} of {data.totalPages}
            </span>
            <button
              type="button"
              disabled={data.last || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </section>
      <AppModal
        open={Boolean(pendingDelete)}
        title="Delete this story?"
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-sm leading-6 text-slate-600">
          {pendingDelete
            ? `“${pendingDelete.title}” will be permanently removed, including its discussion.`
            : "This story will be permanently removed."}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete story
          </button>
        </div>
      </AppModal>
    </main>
  );
}
