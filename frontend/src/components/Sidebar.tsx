"use client";

import {
  Compass,
  Mail,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getSessionUser, subscribeToSession } from "@/lib/session";

const links = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/inbox", label: "Inbox", icon: Mail },
  { href: "/my-drafts", label: "My stories", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const [currentPath, setCurrentPath] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const updatePath = () => setCurrentPath(window.location.pathname);
    updatePath();
    window.addEventListener("popstate", updatePath);
    const refresh = async () => {
      if (!getSessionUser()) {
        setUnreadCount(0);
        return;
      }
      try {
        const conversations =
          await apiRequest<{ unreadCount: number }[]>("/messages");
        if (mounted) {
          setUnreadCount(
            conversations.reduce((count, item) => count + item.unreadCount, 0),
          );
        }
      } catch {
        if (mounted) setUnreadCount(0);
      }
    };
    void refresh();
    const unsubscribe = subscribeToSession(() => void refresh());
    const interval = window.setInterval(() => void refresh(), 30000);
    return () => {
      mounted = false;
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener("popstate", updatePath);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col px-3 py-5">
      <div
        className={`mb-10 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between"}`}
      >
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Drafts home"
          className={`flex items-center gap-3 px-2 text-xl font-bold text-slate-900 ${collapsed ? "justify-center" : ""}`}
        >
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <NotebookPen size={20} />
          </span>
          {!collapsed && "Drafts"}
        </Link>
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700 md:block"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onNavigate}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <X size={18} />
        </button>
      </div>
      {!collapsed && (
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Explore
        </p>
      )}
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => {
              setCurrentPath(href);
              onNavigate();
            }}
            title={
              collapsed
                ? `${label}${href === "/inbox" && unreadCount ? `, ${unreadCount} unread` : ""}`
                : undefined
            }
            aria-current={currentPath === href ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${currentPath === href ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"} ${collapsed ? "justify-center" : ""}`}
          >
            <span className="relative">
              <Icon size={18} />
              {href === "/inbox" && unreadCount > 0 && collapsed && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600" />
              )}
            </span>
            {!collapsed && label}
            {!collapsed && href === "/inbox" && unreadCount > 0 && (
              <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                {unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <Link
        href="/blog/create"
        onClick={onNavigate}
        title={collapsed ? "Write a story" : undefined}
        className={`mt-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white hover:bg-blue-700 ${collapsed ? "px-0" : ""}`}
      >
        <PenLine size={17} /> {!collapsed && "Write a story"}
      </Link>
    </div>
  );
}
