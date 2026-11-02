"use client";

import { LogIn, LogOut, PenLine, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  clearSession,
  getSessionUser,
  type SessionUser,
  saveSession,
  subscribeToSession,
} from "@/lib/session";

export default function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const syncUser = () => setUser(getSessionUser());
    syncUser();
    void apiRequest<SessionUser>("/auth/me")
      .then(saveSession)
      .catch(() => clearSession());
    return subscribeToSession(syncUser);
  }, []);

  async function logout() {
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearSession();
    router.push("/");
  }

  return (
    <nav
      className="relative mx-auto flex min-h-19 w-full flex-1 items-center gap-3 px-4 sm:gap-5 sm:px-6"
      aria-label="Main navigation"
    >
      {user && (
        <Link
          href={`/author/${encodeURIComponent(user.username)}`}
          className="flex max-w-28 shrink-0 items-center gap-2 truncate text-sm font-semibold text-slate-700 transition hover:text-blue-700 sm:max-w-36"
          title={`View ${user.username}'s published stories`}
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt=""
                fill
                unoptimized
                sizes="32px"
                className="object-cover"
              />
            ) : (
              user.username.slice(0, 2).toUpperCase()
            )}
          </span>
          {user.username}
        </Link>
      )}
      <button
        type="button"
        onClick={onOpenSearch}
        className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm text-slate-500 transition hover:border-blue-300 hover:bg-white"
        aria-label="Search stories"
      >
        <Search size={17} className="shrink-0 text-slate-400" />
        <span className="flex-1 truncate">
          Search stories, authors, and ideas
        </span>
        <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-400 sm:inline">
          Ctrl K
        </kbd>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="hidden text-sm font-medium text-slate-600 hover:text-blue-700 sm:inline"
        >
          Discover
        </Link>
        {user && (
          <Link
            href="/my-drafts"
            className="hidden text-sm font-medium text-slate-600 hover:text-blue-700 sm:inline"
          >
            My stories
          </Link>
        )}
        <Link
          href="/blog/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus size={16} />
          <PenLine size={16} />
          <span className="hidden sm:inline">Write</span>
        </Link>
        {user ? (
          <button
            type="button"
            aria-label="Sign out"
            onClick={logout}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={17} />
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
          >
            <LogIn size={16} /> Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
