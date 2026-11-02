"use client";

import { useEffect, useState } from "react";

type OutlineItem = {
  id: string;
  title: string;
  level: number;
};

export default function BlogTableOfContents({
  contentId,
}: {
  contentId: string;
}) {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const content = document.getElementById(contentId);
    if (!content) return;
    const headings = Array.from(
      content.querySelectorAll<HTMLElement>("h1, h2, h3"),
    ).filter((heading) => heading.innerText.trim());

    const outline = headings.map((heading, index) => {
      const title = heading.innerText.trim();
      const slug = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const id = `${contentId}-${slug || "heading"}-${index + 1}`;
      heading.id = id;
      heading.classList.add("blog-heading");
      return { id, title, level: Number(heading.tagName.slice(1)) };
    });

    setItems(outline);
    if (outline[0]) setActiveId(outline[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -72% 0px", threshold: 0 },
    );

    headings.forEach((heading) => {
      observer.observe(heading);
    });
    return () => {
      observer.disconnect();
      headings.forEach((heading) => {
        if (heading.id.startsWith(`${contentId}-`)) {
          heading.removeAttribute("id");
          heading.classList.remove("blog-heading");
        }
      });
    };
  }, [contentId]);

  return (
    <>
      <details className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-blue-800">
          In this story
        </summary>
        {items.length ? (
          <nav aria-label="Table of contents" className="mt-3">
            <ol className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? "location" : undefined}
                    className={`block rounded-lg border-l-2 py-2 pr-2 text-sm leading-5 transition ${
                      activeId === item.id
                        ? "border-blue-600 bg-blue-50 pl-3 font-semibold text-blue-800"
                        : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    } ${item.level > 1 ? "ml-3" : ""}`}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No section headings.</p>
        )}
      </details>
      <aside className="sticky top-24 order-2 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
          In this story
        </p>
        {items.length ? (
          <nav aria-label="Table of contents" className="mt-4">
            <ol className="space-y-1.5">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? "location" : undefined}
                    className={`block rounded-lg border-l-2 py-2 pr-2 text-sm leading-5 transition ${
                      activeId === item.id
                        ? "border-blue-600 bg-blue-50 pl-3 font-semibold text-blue-800"
                        : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    } ${item.level > 1 ? "ml-3" : ""}`}
                  >
                    <span className="line-clamp-2">{item.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-500">
            This story has no section headings.
          </p>
        )}
      </aside>
    </>
  );
}
