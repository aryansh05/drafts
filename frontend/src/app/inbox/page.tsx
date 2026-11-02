"use client";

import {
  ArrowLeft,
  Inbox as InboxIcon,
  MessageCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { type SessionUser, saveSession } from "@/lib/session";

type ConversationSummary = {
  id: string;
  otherUserId: string;
  otherUsername: string;
  latestMessage: string;
  updatedAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

type Thread = {
  conversationId: string;
  otherUserId: string;
  otherUsername: string;
  messages: Message[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function friendlyError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "Messages are unavailable right now. Try again in a moment.";
}

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState("");
  const [thread, setThread] = useState<Thread | null>(null);
  const [recipient, setRecipient] = useState("");
  const [starting, setStarting] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const unreadCount = conversations.reduce(
    (sum, item) => sum + item.unreadCount,
    0,
  );

  const loadInbox = useCallback(async () => {
    try {
      const result = await apiRequest<ConversationSummary[]>("/messages");
      setConversations(result);
    } catch (caught) {
      setError(friendlyError(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void apiRequest<SessionUser>("/auth/me")
      .then((session) => {
        saveSession(session);
        setUser(session);
        const requestedRecipient = new URLSearchParams(
          window.location.search,
        ).get("to");
        if (requestedRecipient) {
          setRecipient(requestedRecipient);
          setStarting(true);
        }
        void loadInbox();
      })
      .catch(() => {
        router.replace(
          `/login?returnTo=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
        );
      });
  }, [loadInbox, router]);

  const loadThread = useCallback(async (conversationId: string) => {
    try {
      const result = await apiRequest<Thread>(`/messages/${conversationId}`);
      setThread(result);
      setError("");
    } catch (caught) {
      setError(friendlyError(caught));
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    void loadThread(activeId);
    void loadInbox();
    const timer = window.setInterval(() => void loadThread(activeId), 10000);
    return () => window.clearInterval(timer);
  }, [activeId, loadInbox, loadThread]);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = content.trim();
    if (!message || sending) return;
    setSending(true);
    setError("");
    try {
      if (starting) {
        const result = await apiRequest<Thread>("/messages/conversations", {
          method: "POST",
          body: JSON.stringify({
            recipientUsername: recipient.trim(),
            content: message,
          }),
        });
        setThread(result);
        setActiveId(result.conversationId);
        setRecipient("");
        setStarting(false);
        window.history.replaceState(null, "", "/inbox");
      } else if (activeId) {
        await apiRequest(`/messages/${activeId}`, {
          method: "POST",
          body: JSON.stringify({ content: message }),
        });
        await loadThread(activeId);
      }
      setContent("");
      await loadInbox();
    } catch (caught) {
      setError(friendlyError(caught));
    } finally {
      setSending(false);
    }
  }

  function startNewMessage(username = "") {
    setActiveId("");
    setThread(null);
    setRecipient(username);
    setStarting(true);
    setError("");
  }

  return (
    <main className="mx-auto max-w-6xl py-4 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <span className="flex gap-2 items-center">
              <ArrowLeft /> Back to Drafts
            </span>
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Inbox
          </h1>
        </div>
        <button
          type="button"
          onClick={() => startNewMessage()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <MessageCircle size={17} /> New message
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid h-[calc(100dvh-14rem)] min-h-105 max-h-190 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Conversations
            </h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {unreadCount} unread
            </span>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Loading inbox…</p>
          ) : conversations.length ? (
            <nav
              className="max-h-36 min-h-0 flex-1 overflow-y-auto lg:max-h-none"
              aria-label="Conversations"
            >
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setStarting(false);
                    setActiveId(conversation.id);
                  }}
                  className={`w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${activeId === conversation.id ? "bg-blue-50/70" : ""}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">
                      {conversation.otherUsername}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-xs font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">
                    {conversation.latestMessage}
                  </span>
                  <span className="mt-2 block text-xs text-slate-400">
                    {formatTime(conversation.updatedAt)}
                  </span>
                </button>
              ))}
            </nav>
          ) : (
            <div className="px-5 py-8 text-center">
              <InboxIcon className="mx-auto text-slate-300" size={26} />
              <p className="mt-3 text-sm font-medium text-slate-700">
                No conversations yet
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Start a conversation from a story or send a new message.
              </p>
            </div>
          )}
        </aside>

        <section
          className="flex min-h-0 flex-col overflow-hidden"
          aria-label="Message thread"
        >
          {starting ? (
            <div className="border-b border-slate-100 px-5 py-4">
              <label
                htmlFor="recipient"
                className="text-sm font-semibold text-slate-900"
              >
                New conversation
              </label>
              <input
                id="recipient"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                maxLength={100}
                placeholder="Creator username"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
              />
            </div>
          ) : thread ? (
            <header className="border-b border-slate-100 px-5 py-4">
              <Link href={`/author/${thread.otherUsername}`}>
                <h2 className="font-semibold text-slate-900 hover:text-blue-700">
                  {thread.otherUsername}
                </h2>
              </Link>
            </header>
          ) : null}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
            {thread?.messages.map((message) => {
              const mine = message.senderId === user?.id;
              return (
                <article
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${mine ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-800"}`}
                  >
                    {!mine && (
                      <p className="mb-1 text-xs font-semibold text-blue-700">
                        {message.senderUsername}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>
                    <time
                      className={`mt-2 block text-right text-xs ${mine ? "text-blue-100" : "text-slate-400"}`}
                      dateTime={message.createdAt}
                    >
                      {formatTime(message.createdAt)}
                    </time>
                  </div>
                </article>
              );
            })}
            {!thread && !starting && (
              <div className="flex h-full min-h-70 flex-col items-center justify-center text-center">
                <MessageCircle size={32} className="text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">
                  Your conversations, in one place
                </p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  Choose a conversation or message a story creator directly.
                </p>
              </div>
            )}
          </div>

          {(starting || activeId) && (
            <form
              noValidate
              onSubmit={submit}
              className="border-t border-slate-100 p-4 sm:p-5"
            >
              <label htmlFor="message-content" className="sr-only">
                Message
              </label>
              <textarea
                id="message-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={4000}
                rows={3}
                placeholder="Write a thoughtful message…"
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {content.length}/4000
                </span>
                <button
                  type="submit"
                  disabled={
                    !content.trim() ||
                    sending ||
                    (starting && !recipient.trim())
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} /> {sending ? "Sending…" : "Send message"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
