"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import RichTextEditor from "@/components/RichTextEditor";
import { ApiError, apiRequest } from "@/lib/api";

export default function CreateBlogPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [disc, setDisc] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !disc.trim()) {
      setError("Please enter a title and short description.");
      return;
    }

    const plainText = content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();

    if (!plainText) {
      setError("Please write some article content.");
      return;
    }

    if (title.trim().length > 200 || disc.trim().length > 200) {
      setError("The title and description must be 200 characters or fewer.");
      return;
    }

    if (imageUrl.trim()) {
      try {
        const parsed = new URL(imageUrl.trim());
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          setError("The cover image must use an HTTP or HTTPS address.");
          return;
        }
      } catch {
        setError("Enter a valid cover image address.");
        return;
      }
    }

    setLoading(true);

    try {
      await apiRequest("/blog", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          disc: disc.trim(),
          content,
          imageUrl: imageUrl.trim() || null,
        }),
      });

      router.push("/my-drafts");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create blog. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-slate-600 hover:text-blue-700"
        >
          <span className="flex gap-2 items-center">
            <ArrowLeft /> Back to Drafts
          </span>
        </Link>

        <header className="mb-8 mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Write a new Draft
          </h1>
          <p className="mt-2 text-slate-500">
            Turn your ideas into a story worth sharing.
          </p>
        </header>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Article title
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your Draft a title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {title.length}/200
            </p>
          </div>

          <div>
            <label
              htmlFor="disc"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Short description
            </label>
            <textarea
              id="disc"
              name="disc"
              required
              maxLength={200}
              rows={3}
              value={disc}
              onChange={(event) => setDisc(event.target.value)}
              placeholder="Give readers a preview of your article..."
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {disc.length}/200
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Cover image{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </h2>
            <ImageUploadField
              label="Cover image"
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>

          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Article content
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Format your article with headings, bold text, lists, quotes,
                links, and more.
              </p>
            </div>

            <RichTextEditor value={content} onChange={setContent} />
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Draft"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
