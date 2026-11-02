import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="font-mono text-sm font-semibold text-blue-700">
          404 / NOT FOUND
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          We couldn’t find that page
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The link may be out of date, or the story may no longer be available.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to stories
        </Link>
      </section>
    </main>
  );
}
