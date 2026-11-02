"use client";

import { MessageCircle, Reply, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type SubmitEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ApiError, apiRequest } from "@/lib/api";
import {
  getSessionUser,
  type SessionUser,
  subscribeToSession,
} from "@/lib/session";

type CommentItem = {
  id: string;
  content: string;
  creatorUsername: string;
  creatorImageUrl: string | null;
  blogAuthor: boolean;
  createdAt: string;
  replies: CommentItem[];
};

type CommentPage = {
  content: CommentItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
};

function CommentAvatar({ comment }: { comment: CommentItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = comment.creatorImageUrl?.trim();

  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
      {imageUrl && !imageFailed ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          unoptimized
          sizes="32px"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        comment.creatorUsername.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CommentEntry({
  comment,
  onReply,
}: {
  comment: CommentItem;
  onReply: (comment: CommentItem) => void;
}) {
  return (
    <article className="py-5">
      <div className="flex items-start gap-3">
        <CommentAvatar comment={comment} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              {comment.creatorUsername}
            </h3>
            {comment.blogAuthor && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Author
              </span>
            )}
            <time
              className="text-xs text-slate-400"
              dateTime={comment.createdAt}
            >
              {displayDate(comment.createdAt)}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {comment.content}
          </p>
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            <Reply size={14} /> Reply
          </button>
          {comment.replies.length > 0 && (
            <div className="mt-3 border-l-2 border-blue-100 pl-4 sm:pl-5">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="py-3 first:pt-1">
                  <div className="flex items-start gap-3">
                    <CommentAvatar comment={reply} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {reply.creatorUsername}
                        </span>
                        {reply.blogAuthor && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            Author
                          </span>
                        )}
                        <time
                          className="text-xs text-slate-400"
                          dateTime={reply.createdAt}
                        >
                          {displayDate(reply.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function BlogComments({
  blogId,
  storyUuid,
}: {
  blogId: string;
  storyUuid: string;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [draft, setDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const replyFormRef = useRef<HTMLFormElement>(null);
  const visibleCommentCount = comments.reduce(
    (count, comment) => count + 1 + comment.replies.length,
    0,
  );

  const loadComments = useCallback(
    async (nextPage = 0, append = false) => {
      setLoading(true);
      setError("");
      try {
        const path = `/blog/${encodeURIComponent(blogId)}/comments?page=${nextPage}&size=20`;
        let result: CommentPage;
        try {
          result = await apiRequest<CommentPage>(path);
        } catch (caught) {
          if (
            !(caught instanceof ApiError) ||
            ![400, 404].includes(caught.status)
          ) {
            throw caught;
          }
          result = await apiRequest<CommentPage>(
            `/blog/${encodeURIComponent(storyUuid)}/comments?page=${nextPage}&size=20`,
          );
        }
        setComments((current) =>
          append ? [...current, ...result.content] : result.content,
        );
        setPage(result.number);
        setHasMore(!result.last);
      } catch (caught) {
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "This discussion is no longer available. Reload the story and try again."
            : caught instanceof ApiError
              ? caught.message
              : "We couldn’t load the discussion. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [blogId, storyUuid],
  );

  useEffect(() => {
    const syncUser = () => setUser(getSessionUser());
    syncUser();
    return subscribeToSession(syncUser);
  }, []);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (replyingTo) {
      replyFormRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    }
  }, [replyingTo]);

  async function submit(content: string, parentId?: string) {
    setPosting(true);
    setError("");
    try {
      const endpoint = parentId
        ? `/blog/${encodeURIComponent(blogId)}/comments/${parentId}/replies`
        : `/blog/${encodeURIComponent(blogId)}/comments`;
      const request = {
        method: "POST",
        body: JSON.stringify({ content: content.trim() }),
      };
      try {
        await apiRequest(endpoint, request);
      } catch (caught) {
        if (
          !(caught instanceof ApiError) ||
          ![400, 404].includes(caught.status)
        ) {
          throw caught;
        }
        const fallbackEndpoint = parentId
          ? `/blog/${encodeURIComponent(storyUuid)}/comments/${parentId}/replies`
          : `/blog/${encodeURIComponent(storyUuid)}/comments`;
        await apiRequest(fallbackEndpoint, request);
      }
      setDraft("");
      setReplyDraft("");
      setReplyingTo(null);
      await loadComments(0);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setUser(null);
        setError("Your session expired. Sign in again to continue.");
        return;
      }
      setError(
        caught instanceof ApiError && caught.status === 404
          ? "This story is no longer available for comments. Reload the page and try again."
          : caught instanceof ApiError && caught.status === 400
            ? caught.message
            : caught instanceof ApiError
              ? caught.message
              : "Your comment couldn’t be posted. Please try again.",
      );
    } finally {
      setPosting(false);
    }
  }

  function submitComment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim()) void submit(draft);
  }

  function submitReply(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (replyingTo && replyDraft.trim()) {
      void submit(replyDraft, replyingTo.id);
    }
  }

  function retry() {
    if (replyingTo && replyDraft.trim()) {
      void submit(replyDraft, replyingTo.id);
    } else if (draft.trim()) {
      void submit(draft);
    } else {
      void loadComments(0);
    }
  }

  return (
    <section
      className="mt-14 border-t border-slate-200 pt-8"
      aria-labelledby="comments-heading"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          <MessageCircle size={19} />
        </span>
        <div>
          <h2
            id="comments-heading"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Discussion
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {visibleCommentCount}{" "}
            {visibleCommentCount === 1 ? "comment" : "comments"} loaded
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={retry}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {user ? (
        <form
          noValidate
          onSubmit={submitComment}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <label
            htmlFor="new-comment"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Add to the discussion
          </label>
          <textarea
            id="new-comment"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Share a thoughtful response…"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{draft.length}/2000</span>
            <button
              type="submit"
              disabled={!draft.trim() || posting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={15} /> {posting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-sm text-slate-700">
            Sign in to join the discussion.
          </p>
          <Link
            href={`/login?returnTo=${encodeURIComponent(typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`)}`}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Sign in
          </Link>
        </div>
      )}

      {replyingTo && user && (
        <form
          noValidate
          ref={replyFormRef}
          onSubmit={submitReply}
          className="mb-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-4"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="reply-comment"
              className="text-sm font-semibold text-slate-800"
            >
              Replying to {replyingTo.creatorUsername}
            </label>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
          <textarea
            id="reply-comment"
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Write a reply…"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={!replyDraft.trim() || posting}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {posting ? "Posting…" : "Post reply"}
            </button>
          </div>
        </form>
      )}

      {loading && comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Loading discussion…
        </p>
      ) : comments.length ? (
        <div className="divide-y divide-slate-200">
          {comments.map((comment) => (
            <CommentEntry
              key={comment.id}
              comment={comment}
              onReply={setReplyingTo}
            />
          ))}
        </div>
      ) : !loading && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center">
          <p className="font-semibold text-slate-800">Start the conversation</p>
          <p className="mt-1 text-sm text-slate-500">
            Share a useful thought or question about this story.
          </p>
        </div>
      ) : null}

      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadComments(page + 1, true)}
          className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more comments"}
        </button>
      )}
    </section>
  );
}
