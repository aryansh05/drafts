import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AppModal({
  open,
  title,
  eyebrow = "Drafts account",
  onClose,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="drafts-dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        className={`drafts-dialog-panel relative z-10 my-auto w-full ${width} rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/25 sm:p-8`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              {eyebrow}
            </p>
            <h1
              id="app-modal-title"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-950"
            >
              {title}
            </h1>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
