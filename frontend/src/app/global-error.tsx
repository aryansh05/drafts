"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <main className="max-w-lg text-center">
          <p className="font-mono text-sm text-blue-300">DRAFTS / RECOVERY</p>
          <h1 className="mt-4 text-3xl font-bold">
            We hit an unexpected problem.
          </h1>
          <p className="mt-3 text-slate-300">
            Try again. If the problem continues, return to the home page.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
