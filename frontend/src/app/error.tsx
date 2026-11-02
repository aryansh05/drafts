"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[65vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle size={22} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
          This page hit a problem
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your work is safe. Try loading this page again, or return to the story
          feed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RotateCcw size={16} /> Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go to Drafts
          </Link>
        </div>
      </section>
    </main>
  );
}
