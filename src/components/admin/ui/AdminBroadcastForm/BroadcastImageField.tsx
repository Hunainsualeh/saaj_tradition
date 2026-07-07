"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageOff, Link2 as LinkIcon, Loader2, UploadCloud, X } from "lucide-react";

const ACCEPT_TYPES = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — matches the upload route's limit.

/** Thumbnail that falls back gracefully when the URL is unreachable. */
function ImageThumb({ src }: { src: string }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300">
        <ImageOff size={18} />
      </div>
    );
  }

  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setErrored(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/**
 * Image input for broadcast emails: upload a file straight to Cloudinary
 * (optimized + resized for email) or paste an external URL instead.
 */
export function BroadcastImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const upload = async (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File too large — max 10 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/emails/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
      toast.success("Image uploaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const applyUrlDraft = () => {
    const next = urlDraft.trim();
    if (!next) return;
    onChange(next);
    setUrlDraft("");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        <ImageThumb src={value} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_TYPES}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
              {uploading ? "Uploading…" : value ? "Replace" : "Upload image"}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-400 transition-colors hover:text-red-500"
              >
                <X size={13} /> Remove
              </button>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyUrlDraft();
                }
              }}
              placeholder="…or paste an image URL"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="button"
              disabled={!urlDraft.trim()}
              onClick={applyUrlDraft}
              aria-label="Use image URL"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <LinkIcon size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
