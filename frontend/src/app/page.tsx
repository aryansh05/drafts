import Link from "next/link";
import { Suspense } from "react";
import BlogFeed from "@/components/BlogFeed";
import { SITE_URL } from "@/lib/seo";

type HomePageProps = {
  searchParams: Promise<{ page?: string; q?: string; order?: string }>;
};

export default function Home({ searchParams }: HomePageProps) {
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Drafts",
          url: `${SITE_URL}/`,
        }).replace(/</g, "\\u003c")}
      </script>
      <div className="min-h-screen">
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <header className="border-b border-slate-200 pb-10 text-center sm:pb-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Independent writing, shared openly
            </p>
            <h1 className="text-12xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              ----------
              <code className="font-mono px-2 py-1 rounded">
                Welcome to{" "}
                <span className="text-blue-600 font-bold">Drafts</span>
              </code>
              ----------
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Thoughtful stories and ideas from people who care about their
              craft.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <a
                href="#stories"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Explore stories
              </a>
              <Link
                href="/blog/create"
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Start writing
              </Link>
            </div>
          </header>
          <div id="stories" className="scroll-mt-24 pt-8 sm:pt-10">
            <Suspense
              fallback={
                <div className="grid gap-x-7 gap-y-10 py-8 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="h-72 animate-pulse rounded-2xl bg-slate-200/70"
                    />
                  ))}
                </div>
              }
            >
              <BlogFeed searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </div>
    </>
  );
}
