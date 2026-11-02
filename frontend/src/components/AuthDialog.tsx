"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";
import AppModal from "@/components/AppModal";
import { loginUser, registerRequest } from "@/lib/auth";
import { saveSession } from "@/lib/session";

export default function AuthDialog({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  function close() {
    router.push("/");
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (isSignup && username.trim().length < 3) {
      setError("Your username must be at least 3 characters long.");
      return;
    }
    if (isSignup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isSignup && !username.trim()) {
      setError("Enter your username or email address.");
      return;
    }
    if (password.length < (isSignup ? 8 : 1) || password.length > 150) {
      setError(
        isSignup
          ? "Use a password between 8 and 150 characters."
          : "Enter your password.",
      );
      return;
    }
    setLoading(true);
    try {
      const session = isSignup
        ? await registerRequest({
            username: username.trim(),
            email: email.trim(),
            password,
          })
        : await loginUser({ name: username.trim(), password });
      saveSession(session);
      const requestedPath = new URLSearchParams(window.location.search).get(
        "returnTo",
      );
      const destination =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/";
      router.push(destination);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isSignup
            ? "We could not create your account. Try again."
            : "We could not sign you in. Check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal
      open
      title={isSignup ? "Create your account" : "Welcome back"}
      onClose={close}
    >
      <p className="-mt-2 mb-6 text-sm leading-6 text-slate-500">
        {isSignup
          ? "Join the community and publish stories of your own."
          : "Sign in to write, comment, and manage your stories."}
      </p>
      <form noValidate onSubmit={submit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
          >
            {error}
          </div>
        )}
        {isSignup && (
          <label className="block text-sm font-semibold text-slate-700">
            Username
            <input
              autoComplete="username"
              minLength={3}
              maxLength={100}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        )}
        {isSignup ? (
          <label className="block text-sm font-semibold text-slate-700">
            Email address
            <input
              type="email"
              autoComplete="email"
              maxLength={255}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        ) : (
          <label className="block text-sm font-semibold text-slate-700">
            Username or email
            <input
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            maxLength={150}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          {loading
            ? isSignup
              ? "Creating account…"
              : "Signing in…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        {isSignup ? "Already have an account?" : "New to Drafts?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </AppModal>
  );
}
