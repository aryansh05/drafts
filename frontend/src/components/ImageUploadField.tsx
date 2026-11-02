"use client";

import { ImagePlus, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  folder: string;
  uploadPreset: string;
  allowedFormats: string;
  timestamp: number;
  signature: string;
};

export default function ImageUploadField({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    setError("");
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      setError("Choose a JPEG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const signed = await apiRequest<CloudinaryUploadSignature>(
        "/uploads/signature",
        { method: "POST" },
      );
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signed.apiKey);
      form.append("folder", signed.folder);
      form.append("upload_preset", signed.uploadPreset);
      form.append("allowed_formats", signed.allowedFormats);
      form.append("timestamp", String(signed.timestamp));
      form.append("signature", signed.signature);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,
        { method: "POST", body: form },
      );
      const result = (await response.json()) as {
        secure_url?: string;
        error?: { message?: string };
      };
      if (!response.ok || !result.secure_url) {
        throw new Error(
          result.error?.message || "The image could not be uploaded.",
        );
      }
      onChange(result.secure_url);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The image could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <Image
            src={value}
            alt={`${label} preview`}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={(event) => void upload(event.currentTarget.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60"
        >
          {uploading ? (
            <Upload size={16} className="animate-pulse" />
          ) : (
            <ImagePlus size={16} />
          )}
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm font-medium text-slate-500 hover:text-red-600"
          >
            Remove image
          </button>
        )}
        <span className="text-xs text-slate-500">JPEG or PNG, up to 5 MB</span>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Or use an image URL
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
