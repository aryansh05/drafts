"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import RichTextEditor from "@/components/RichTextEditor";
import { ApiError, apiRequest } from "@/lib/api";
import type { Blog } from "@/types/blog";

export default function EditBlogForm({ id }: { id: string }) {
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiRequest<Blog>(`/blog/mine/${encodeURIComponent(id)}`)
      .then((story) => {
        setBlog(story);
        setContent(story.content);
        setImageUrl(story.imageUrl ?? "");
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Unable to load this story.",
        );
      });
  }, [id, router]);

  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!blog) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("disc") ?? "").trim();
    const coverImage = imageUrl.trim();
    if (
      !title ||
      !description ||
      title.length > 200 ||
      description.length > 200
    ) {
      setError("Enter a title and description of 200 characters or fewer.");
      return;
    }
    if (coverImage) {
      try {
        const parsed = new URL(coverImage);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          setError("The cover image must use an HTTP or HTTPS address.");
          return;
        }
      } catch {
        setError("Enter a valid cover image address.");
        return;
      }
    }
    setSaving(true);
    try {
      await apiRequest(`/blog/${blog.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          disc: description,
          content,
          imageUrl: coverImage || null,
        }),
      });
      router.push("/my-drafts");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-2 py-8 sm:px-4">
      <Link href="/my-drafts" className="text-sm font-medium text-blue-600">
        ← My stories
      </Link>
      <h1 className="mb-6 mt-4 text-3xl font-bold text-slate-900">
        Edit story
      </h1>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {!blog ? (
        <p className="py-12 text-center text-slate-500">Loading story…</p>
      ) : (
        <form
          noValidate
          onSubmit={save}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Title
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={blog.title}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              name="disc"
              required
              maxLength={200}
              defaultValue={blog.disc}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
            />
          </label>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Cover image
            </h2>
            <ImageUploadField
              value={imageUrl}
              onChange={setImageUrl}
              label="Cover image"
            />
          </div>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Continue writing your story..."
          />
          <div className="flex justify-end gap-3">
            <Link
              href="/my-drafts"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
