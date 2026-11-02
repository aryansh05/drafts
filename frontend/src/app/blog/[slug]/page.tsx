import { ArrowLeft, Clock3, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import BlogComments from "@/components/BlogComments";
import BlogContent from "@/components/BlogContent";
import BlogLikeButton from "@/components/BlogLikeButton";
import BlogLikeProvider from "@/components/BlogLikeProvider";
import BlogTableOfContents from "@/components/BlogTableOfContents";
import ReadingProgress from "@/components/ReadingProgress";
import ShareButton from "@/components/ShareButton";
import { apiRequest } from "@/lib/api";
import { getReadingMinutes } from "@/lib/content";
import type { Blog } from "@/types/blog";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

const getBlog = cache((slug: string) =>
  apiRequest<Blog>(`/blog/${encodeURIComponent(slug)}`),
);

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const blog = await getBlog(slug);
    return {
      title: blog.title,
      description: blog.disc,
      alternates: { canonical: `/blog/${blog.slug}` },
      openGraph: {
        title: blog.title,
        description: blog.disc,
        type: "article",
        publishedTime: blog.createdAt,
        modifiedTime: blog.updatedAt,
        authors: [blog.creatorUsername],
        siteName: "Drafts",
        ...(blog.imageUrl ? { images: [blog.imageUrl] } : {}),
      },
      twitter: {
        card: blog.imageUrl ? "summary_large_image" : "summary",
        title: blog.title,
        description: blog.disc,
        ...(blog.imageUrl ? { images: [blog.imageUrl] } : {}),
      },
    };
  } catch {
    return { title: "Story" };
  }
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function BlogLoading() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto grid max-w-[90rem] items-start gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-12 xl:gap-16">
        <aside className="sticky top-24 order-2 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            In this story
          </p>
          <div className="mt-4 space-y-3 animate-pulse">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-4/5 bg-slate-100 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
          </div>
        </aside>

        <article className="mx-auto w-full max-w-3xl lg:order-1 lg:mx-0 lg:max-w-none bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-6">
          <div className="h-4 w-28 bg-slate-100 rounded" />
          <div className="space-y-3">
            <div className="h-3 w-36 bg-blue-50 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
            <div className="h-10 w-2/3 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-24 w-full bg-slate-100 rounded-xl" />
        </article>
      </div>
    </main>
  );
}

async function BlogArticle({ params }: BlogPageProps) {
  const { slug } = await params;

  let blog: Blog;

  try {
    blog = await getBlog(slug);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("404") ||
        error.message.toLowerCase().includes("not found"))
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: blog.title,
          description: blog.disc,
          image: blog.imageUrl || undefined,
          datePublished: blog.createdAt,
          dateModified: blog.updatedAt,
          author: {
            "@type": "Person",
            name: blog.creatorUsername,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/author/${encodeURIComponent(blog.creatorUsername)}`,
          },
          mainEntityOfPage: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blog/${blog.slug}`,
          publisher: { "@type": "Organization", name: "Drafts" },
        }).replace(/</g, "\\u003c")}
      </script>
      <ReadingProgress targetId={`story-content-${blog.id}`} />
      <div className="mx-auto grid max-w-[90rem] items-start gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-12 lg:py-12 xl:gap-16">
        <BlogTableOfContents contentId={`story-content-${blog.id}`} />
        <article className="mx-auto w-full max-w-3xl lg:order-1 lg:mx-0 lg:max-w-none">
          <Link
            href="/"
            className="mb-8 inline-flex text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <span className="flex gap-2 items-center">
              <ArrowLeft /> Back to Drafts
            </span>
          </Link>
          <header className="mb-9">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              From the Drafts journal
            </p>

            <h1 className="editorial-serif text-4xl font-normal leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
              {blog.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              {blog.disc}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/author/${encodeURIComponent(blog.creatorUsername)}`}
                  aria-label={`View ${blog.creatorUsername}'s profile`}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-800"
                >
                  {blog.creatorProfileImageUrl ? (
                    <Image
                      src={blog.creatorProfileImageUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    blog.creatorUsername.slice(0, 2).toUpperCase()
                  )}
                </Link>
                <div>
                  <Link
                    href={`/author/${encodeURIComponent(blog.creatorUsername)}`}
                    className="text-sm font-semibold text-slate-900 transition hover:text-blue-700"
                  >
                    {blog.creatorUsername}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    {formatDate(blog.createdAt)}
                    <span aria-hidden="true">·</span>
                    <Clock3 size={13} />
                    {getReadingMinutes(blog.content)} min read
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BlogLikeProvider blogIds={[blog.id]}>
                  <BlogLikeButton
                    blogId={blog.id}
                    initialCount={blog.likeCount}
                    initiallyLiked={blog.likedByCurrentUser}
                    compact
                  />
                </BlogLikeProvider>
                <Link
                  href={`/inbox?to=${encodeURIComponent(blog.creatorUsername)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
                >
                  <MessageCircle size={16} /> Message author
                </Link>
                <ShareButton />
              </div>
            </div>
          </header>
          {blog.imageUrl && (
            <div className="relative mb-10 aspect-video overflow-hidden rounded-2xl bg-slate-200">
              <Image
                src={blog.imageUrl}
                alt={blog.title}
                fill
                unoptimized
                priority
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          )}
          <div className="text-base leading-8 sm:text-lg">
            <BlogContent
              content={blog.content}
              id={`story-content-${blog.id}`}
            />
          </div>
          <BlogComments blogId={blog.slug} storyUuid={blog.id} />
        </article>
      </div>
    </main>
  );
}

export default function BlogDetailsPage({ params }: BlogPageProps) {
  return (
    <Suspense fallback={<BlogLoading />}>
      <BlogArticle params={params} />
    </Suspense>
  );
}
