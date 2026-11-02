"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "@/lib/api";
import { getSessionUser, subscribeToSession } from "@/lib/session";

type BlogLikeContextValue = {
  likedIds: Set<string>;
  ready: boolean;
  setLiked: (id: string, liked: boolean) => void;
};

export const BlogLikeContext = createContext<BlogLikeContextValue | null>(null);

export default function BlogLikeProvider({
  blogIds,
  children,
}: {
  blogIds: string[];
  children: ReactNode;
}) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const idsKey = blogIds.join(",");

  const setLiked = useCallback((id: string, liked: boolean) => {
    setLikedIds((current) => {
      const next = new Set(current);
      if (liked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!getSessionUser() || !idsKey) {
        if (active) {
          setLikedIds(new Set());
          setReady(true);
        }
        return;
      }
      try {
        const ids = await apiRequest<string[]>(
          `/blog/likes?ids=${encodeURIComponent(idsKey)}`,
        );
        if (active) setLikedIds(new Set(ids));
      } catch {
        if (active) setLikedIds(new Set());
      } finally {
        if (active) setReady(true);
      }
    };
    setReady(false);
    void load();
    const unsubscribe = subscribeToSession(() => void load());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [idsKey]);

  const value = useMemo(
    () => ({ likedIds, ready, setLiked }),
    [likedIds, ready, setLiked],
  );

  return (
    <BlogLikeContext.Provider value={value}>
      {children}
    </BlogLikeContext.Provider>
  );
}
