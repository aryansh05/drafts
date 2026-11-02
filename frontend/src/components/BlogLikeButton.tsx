"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { BlogLikeContext } from "@/components/BlogLikeProvider";
import { ApiError, apiRequest } from "@/lib/api";

export default function BlogLikeButton({
  blogId,
  initialCount,
  initiallyLiked,
  compact = false,
}: {
  blogId: string;
  initialCount: number;
  initiallyLiked: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const likes = useContext(BlogLikeContext);
  const [count, setCount] = useState(initialCount);
  const [localLiked, setLocalLiked] = useState(initiallyLiked);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const liked = likes?.ready ? likes.likedIds.has(blogId) : localLiked;

  async function toggleLike() {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      const result = await apiRequest<{ likeCount: number; liked: boolean }>(
        `/blog/${blogId}/like`,
        {
          method: "PUT",
          body: JSON.stringify({ liked: !liked }),
        },
      );
      setCount(result.likeCount);
      setLocalLiked(result.liked);
      likes?.setLiked(blogId, result.liked);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        const returnTo = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`,
        );
        router.push(`/login?returnTo=${returnTo}`);
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Your like could not be saved. Try again.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className={`${compact ? "" : "mt-3"} flex min-h-8 items-center justify-between gap-3`}
    >
      <button
        type="button"
        onClick={() => void toggleLike()}
        disabled={working}
        aria-pressed={liked}
        aria-label={`${liked ? "Unlike" : "Like"} this story`}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold transition ${liked ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"} disabled:opacity-60`}
      >
        <Heart size={16} fill={liked ? "currentColor" : "none"} />
        <span>{count}</span>
      </button>
      <span aria-live="polite" className="text-xs text-red-600">
        {error}
      </span>
    </div>
  );
}
