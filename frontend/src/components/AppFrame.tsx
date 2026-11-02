"use client";

import { Menu, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import SearchDialog from "@/components/SearchDialog";
import Sidebar from "@/components/Sidebar";

export default function AppFrame({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function openSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  return (
    <div
      className={`grid min-h-screen grid-cols-1 ${collapsed ? "md:grid-cols-[4.75rem_minmax(0,1fr)]" : "md:grid-cols-[15rem_minmax(0,1fr)]"}`}
    >
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
        />
      )}
      <aside
        className={`border-r border-slate-200 bg-white ${mobileOpen ? "fixed inset-y-0 left-0 z-50 block w-72 shadow-2xl" : "hidden"} md:sticky md:top-0 md:block md:h-screen md:w-auto md:shadow-none`}
      >
        <Sidebar
          collapsed={collapsed && !mobileOpen}
          onToggle={() => setCollapsed((value) => !value)}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center">
            <button
              type="button"
              aria-label={
                mobileOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className="ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Navbar onOpenSearch={() => setSearchOpen(true)} />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-3 sm:p-6">{children}</main>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
