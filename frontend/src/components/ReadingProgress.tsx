"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (!target) return;
        const bounds = target.getBoundingClientRect();
        const total = target.offsetHeight - window.innerHeight;
        const distance = Math.max(0, -bounds.top);
        setProgress(total <= 0 ? 100 : Math.min(100, (distance / total) * 100));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
      role="progressbar"
      aria-label="Story reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="h-full bg-blue-600 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
