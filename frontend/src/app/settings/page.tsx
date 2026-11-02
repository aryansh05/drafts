"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import { ApiError, apiRequest } from "@/lib/api";
import {
  getSessionUser,
  saveSession,
  updateSessionProfileImage,
} from "@/lib/session";
import type { AuthResponse, PublicProfile } from "@/types/auth";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const user =
          getSessionUser() ?? (await apiRequest<AuthResponse>("/auth/me"));
        saveSession(user);
        setUsername(user.username);
        setEmail(user.email);
        setImageUrl(user.profileImageUrl ?? "");
        const profile = await apiRequest<PublicProfile>(
          `/users/${encodeURIComponent(user.username)}`,
        );
        setImageUrl(profile.profileImageUrl ?? "");
      } catch {
        router.replace("/login?returnTo=%2Fsettings");
      }
    };
    void initialize();
  }, [router]);

  async function saveProfilePhoto(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setNotice("");
    try {
      await apiRequest<PublicProfile>("/users/me/profile-image", {
        method: "PUT",
        body: JSON.stringify({ profileImageUrl: imageUrl || null }),
      });
      updateSessionProfileImage(imageUrl || null);
      setNotice("Profile photo saved.");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace("/login");
        return;
      }
      setProfileError(
        caught instanceof Error
          ? caught.message
          : "Could not save your profile photo.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAccount(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAccount(true);
    setAccountError("");
    setNotice("");
    try {
      const session = await apiRequest<AuthResponse>("/users/me/account", {
        method: "PUT",
        body: JSON.stringify({ username, email, currentPassword }),
      });
      saveSession(session);
      setUsername(session.username);
      setEmail(session.email);
      setCurrentPassword("");
      setNotice(
        "Account details saved. Other devices will need to sign in again after their current session expires.",
      );
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace("/login");
        return;
      }
      setAccountError(
        caught instanceof Error
          ? caught.message
          : "Could not save account details.",
      );
    } finally {
      setSavingAccount(false);
    }
  }

  async function changePassword(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setNotice("");
    try {
      const session = await apiRequest<AuthResponse>("/users/me/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      saveSession(session);
      setCurrentPassword("");
      setNewPassword("");
      setNotice(
        "Password updated. Other devices will need to sign in again after their current session expires.",
      );
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace("/login");
        return;
      }
      setPasswordError(
        caught instanceof Error
          ? caught.message
          : "Could not update your password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        href="/"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-blue-700"
      >
        <span className="flex gap-2 items-center">
          <ArrowLeft /> Back to Drafts
        </span>
      </Link>
      <header className="mb-8 mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Account
        </p>
        <h1 className="editorial-serif mt-2 text-4xl font-normal text-slate-950">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Manage your profile and sign-in details.
        </p>
      </header>
      {notice && (
        <output className="mb-5 block rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </output>
      )}

      <div className="space-y-6">
        <form
          onSubmit={saveProfilePhoto}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Profile photo
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              This photo appears beside your name and on your public author
              page.
            </p>
          </div>
          {profileError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {profileError}
            </p>
          )}
          <ImageUploadField
            value={imageUrl}
            onChange={(value) => {
              setImageUrl(value);
              setNotice("");
            }}
            label="Profile photo"
          />
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={savingProfile || !username}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save photo"}
            </button>
          </div>
        </form>

        <form
          onSubmit={saveAccount}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Account details
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Your username is shown publicly. Your email is kept private.
            </p>
          </div>
          {accountError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {accountError}
            </p>
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Username
            <input
              required
              minLength={3}
              maxLength={100}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Email address
            <input
              required
              type="email"
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Current password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={
                savingAccount || !username || !email || !currentPassword
              }
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {savingAccount ? "Saving…" : "Save account details"}
            </button>
          </div>
        </form>

        <form
          onSubmit={changePassword}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Password</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use at least 8 characters. Other devices will need to sign in
              again after their current session expires.
            </p>
          </div>
          {passwordError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {passwordError}
            </p>
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Current password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            New password
            <input
              required
              type="password"
              minLength={8}
              maxLength={150}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={
                savingPassword || !currentPassword || newPassword.length < 8
              }
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
