"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Blog, BlogPage } from "@/types/blog";

export default function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Blog[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (!open || !term) {
      setMatches([]);
      setSearching(false);
      return;
    }
    setMatches([]);
    setSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      apiRequest<BlogPage>(
        `/blog?page=0&size=8&q=${encodeURIComponent(term)}&order=popular`,
        { signal: controller.signal },
      )
        .then((result) => setMatches(result.content))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setMatches([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    onClose();
    router.push(params.size ? `/?${params.toString()}#stories` : "/#stories");
  }

  if (!open) return null;

  return (
    <div className="drafts-dialog-backdrop fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-[10vh] backdrop-blur-md sm:py-[14vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
        className="drafts-dialog-panel relative z-10 w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-5 shadow-2xl shadow-slate-950/30 sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Quick search
            </p>
            <h2
              id="search-dialog-title"
              className="mt-1 text-xl font-semibold text-slate-950"
            >
              Search stories
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              aria-label="Search stories, authors, and ideas"
              placeholder="Try a topic, title, or author"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent py-4 text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
            {searching && (
              <span className="text-xs text-slate-400">Searching</span>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {query.trim()
                ? "Matching stories"
                : "Search by subject or author"}
            </p>
            <span className="text-xs text-slate-400">
              Press Enter for all results
            </span>
          </div>
          {query.trim() ? (
            matches.length ? (
              <ul className="mt-2 max-h-[45vh] divide-y divide-slate-100 overflow-y-auto">
                {matches.map((blog) => (
                  <li key={blog.id}>
                    <Link
                      href={`/blog/${encodeURIComponent(blog.slug)}`}
                      onClick={onClose}
                      className="block rounded-lg px-3 py-3 hover:bg-blue-50"
                    >
                      <span className="block line-clamp-1 text-sm font-semibold text-slate-900">
                        {blog.title}
                      </span>
                      <span className="mt-1 block line-clamp-1 text-sm text-slate-500">
                        {blog.disc}
                      </span>
                      <span className="mt-1 block text-xs text-blue-700">
                        By {blog.creatorUsername}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : !searching ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No matching stories found.
              </p>
            ) : null
          ) : (
            <div className="mt-3 rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Search published stories by title, author, or topic.
            </div>
          )}
          {query.trim() && (
            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              See all results for “{query.trim()}”
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
