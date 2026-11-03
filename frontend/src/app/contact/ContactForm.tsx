"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ContactFields = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

const initialFields: ContactFields = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function ContactPage() {
  const router = useRouter();
  const [fields, setFields] = useState(initialFields);
  const [touched, setTouched] = useState<
    Partial<Record<keyof ContactFields, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const complete =
    Object.values(fields).every((value) => value.trim().length > 0) &&
    emailPattern.test(fields.email.trim());

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [router]);

  function fieldError(field: keyof ContactFields): string | null {
    const value = fields[field].trim();
    if (!value) return "This field is required.";
    if (field === "email" && !emailPattern.test(value))
      return "Enter a valid email address.";
    return null;
  }

  function updateField(field: keyof ContactFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ fullName: true, email: true, subject: true, message: true });
    if (!complete || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
      if (!accessKey) {
        throw new Error(
          "The contact form is not configured yet. Please try again later.",
        );
      }
      const formData = new FormData(event.currentTarget);
      formData.set("access_key", accessKey);
      formData.set("name", fields.fullName.trim());
      formData.set("from_name", "Drafts");
      formData.set("botcheck", "");
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Your message could not be sent. Please try again.",
        );
      }
      setFields(initialFields);
      setTouched({});
      setFeedback({
        type: "success",
        text: "Your message has been sent. Thanks for reaching out!",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Your message could not be sent. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/35 px-3 py-6 backdrop-blur-md sm:px-6 sm:py-10">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close contact dialog"
        onClick={() => router.push("/")}
        className="absolute inset-0 z-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-dialog-title"
        className="relative z-10 my-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-slate-950/25 md:grid-cols-[0.88fr_1.12fr]"
      >
        <button
          type="button"
          aria-label="Close contact dialog"
          onClick={() => router.push("/")}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <X size={19} aria-hidden="true" />
        </button>
        <section className="flex flex-col justify-between border-b border-slate-200 bg-blue-50/60 px-6 py-8 sm:px-10 sm:py-12 md:border-b-0 md:border-r">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">
              A note to Drafts
            </p>
            <h1
              id="contact-dialog-title"
              className="editorial-serif mt-8 text-4xl leading-[1.12] tracking-tight text-slate-950 sm:text-5xl"
            >
              Hi, I&apos;m <span className="text-blue-700">Aryan Sharma,</span>{" "}
              the person behind <span className="text-blue-700">Drafts.</span>
            </h1>
            <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">
              Let&apos;s Connect!
            </h2>
            <p className="mt-4 max-w-sm text-base leading-7 text-slate-600">
              Have a question, an interesting opportunity, or just want to say
              hello? I&apos;d love to hear from you. Drop me a message!
            </p>
          </div>
          <Image
            src="/icon.svg"
            alt="Drafts app icon"
            width={112}
            height={112}
            priority
            className="mx-auto block size-28 rounded-3xl shadow-md shadow-blue-950/10"
          />
          <p className="mt-12 border-t border-blue-200 pt-4 text-sm text-slate-500">
            I read every message that comes through.
          </p>
        </section>

        <section
          className="px-6 py-8 sm:px-10 sm:py-12"
          aria-labelledby="contact-form-heading"
        >
          <div className="mb-8">
            <h2
              id="contact-form-heading"
              className="editorial-serif text-3xl font-semibold tracking-tight text-slate-950"
            >
              Send a message
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              All fields are required. I&apos;ll get back to you as soon as I
              can.
            </p>
          </div>

          {feedback && (
            <div
              role={feedback.type === "error" ? "alert" : "status"}
              className={`mb-6 flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={submit} noValidate className="space-y-5">
            <input type="hidden" name="from_name" value="Drafts" />
            <input
              type="checkbox"
              name="botcheck"
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
            />
            <Field
              label="Full Name"
              name="fullName"
              value={fields.fullName}
              placeholder="Enter your full name"
              error={touched.fullName ? fieldError("fullName") : null}
              onChange={(value) => updateField("fullName", value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, fullName: true }))
              }
            />
            <Field
              label="Email Address"
              name="email"
              type="email"
              value={fields.email}
              placeholder="Enter your email address"
              error={touched.email ? fieldError("email") : null}
              onChange={(value) => updateField("email", value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, email: true }))
              }
            />
            <Field
              label="Subject"
              name="subject"
              value={fields.subject}
              placeholder="What is this regarding?"
              error={touched.subject ? fieldError("subject") : null}
              onChange={(value) => updateField("subject", value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, subject: true }))
              }
            />
            <div>
              <label
                htmlFor="message"
                className="text-sm font-medium text-slate-700"
              >
                Message{" "}
                <span aria-hidden="true" className="text-blue-700">
                  *
                </span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={5000}
                rows={5}
                value={fields.message}
                placeholder="Write your message here..."
                onChange={(event) => updateField("message", event.target.value)}
                onBlur={() =>
                  setTouched((current) => ({ ...current, message: true }))
                }
                aria-invalid={Boolean(touched.message && fieldError("message"))}
                aria-describedby={
                  touched.message && fieldError("message")
                    ? "message-error"
                    : undefined
                }
                className={`${inputClass} min-h-36 resize-y`}
              />
              {touched.message && fieldError("message") && (
                <p id="message-error" className="mt-1.5 text-sm text-rose-700">
                  {fieldError("message")}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!complete || submitting}
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  Send Message{" "}
                  <Send
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  placeholder,
  error,
  onChange,
  onBlur,
  type = "text",
}: {
  label: string;
  name: keyof ContactFields;
  value: string;
  placeholder: string;
  error: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
  type?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}{" "}
        <span aria-hidden="true" className="text-blue-700">
          *
        </span>
      </label>
      <input
        id={name}
        name={name === "fullName" ? "name" : name}
        type={type}
        required
        maxLength={name === "fullName" ? 120 : name === "subject" ? 180 : 254}
        autoComplete={
          name === "fullName" ? "name" : name === "email" ? "email" : "off"
        }
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={inputClass}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
