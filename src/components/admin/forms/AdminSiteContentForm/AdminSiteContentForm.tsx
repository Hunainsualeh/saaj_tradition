"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AdminButton,
  AdminField,
  AdminFieldGroup,
  AdminFieldLabel,
  AdminFieldSet,
  AdminInput,
} from "@/components/admin";
import { bulkUpdateSiteContent } from "@/lib/server/actions";
import { SiteContentItem } from "@/types/client";
import { API_ROUTES } from "@/lib";

type AdminSiteContentFormProps = {
  items: SiteContentItem[];
};

/** Determine whether a site-content key is a media (image / video) URL field. */
function getMediaType(key: string): "image" | "video" | null {
  if (key.endsWith("_video_url")) return "video";
  if (
    key.endsWith("_image_url") ||
    key.endsWith("_image_1") ||
    key.endsWith("_image_2") ||
    key.endsWith("_image_3") ||
    key.endsWith("_image_4") ||
    key === "about_fact_image"
  )
    return "image";
  return null;
}

/** Render a colour swatch + hex text input */
function ColorField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-neutral-200 p-0.5 bg-white"
        aria-label="Pick colour"
      />
      <AdminInput
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono"
        placeholder="#000000"
      />
    </div>
  );
}

/** Render an on/off toggle for "true"/"false" string values */
function ActiveToggle({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isOn = value === "true";
  return (
    <div className="flex items-center gap-3 py-1">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={isOn}
        onClick={() => onChange(isOn ? "false" : "true")}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
          isOn ? "bg-neutral-900" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            isOn ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-neutral-600 select-none">
        {isOn ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

/**
 * MediaUploadField — uploads images (≤ 50 MB) or videos (≤ 200 MB) directly
 * to Cloudinary via a server-signed upload request, bypassing Vercel's 4.5 MB
 * payload limit entirely.
 */
function MediaUploadField({
  id,
  value,
  mediaType,
  onChange,
}: {
  id: string;
  value: string;
  mediaType: "image" | "video";
  onChange: (v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const maxMB = mediaType === "video" ? 200 : 50;
  const accept = mediaType === "video" ? "video/*" : "image/*";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";

    if (!file) return;

    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File too large. Maximum size is ${maxMB} MB.`);
      return;
    }

    setIsUploading(true);
    try {
      // 1. Get signed upload params from our server
      const sigRes = await fetch(
        `${API_ROUTES.SITE_CONTENT.UPLOAD_SIGNATURE}?resourceType=${mediaType}`,
      );
      if (!sigRes.ok) {
        const err = await sigRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Failed to get upload signature",
        );
      }
      const { signature, timestamp, apiKey, cloudName, folder } =
        (await sigRes.json()) as {
          signature: string;
          timestamp: number;
          apiKey: string;
          cloudName: string;
          folder: string;
        };

      // 2. Upload directly to Cloudinary (bypasses Vercel size limits)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${mediaType}/upload`,
        { method: "POST", body: fd },
      );
      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: { message?: string } }).error?.message ??
            "Cloudinary upload failed",
        );
      }
      const result = (await uploadRes.json()) as { secure_url: string };
      onChange(result.secure_url);
      toast.success(`${mediaType === "video" ? "Video" : "Image"} uploaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <AdminInput
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            mediaType === "video"
              ? "Paste Cloudinary video URL or upload below"
              : "Paste Cloudinary image URL or upload below"
          }
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
        <AdminButton
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          {isUploading ? "Uploading…" : `Upload ${mediaType === "video" ? "Video" : "Image"}`}
        </AdminButton>
      </div>
      <p className="text-xs text-neutral-400">
        Max {maxMB} MB · Direct upload to Cloudinary (no server size limit)
      </p>
      {value && mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Preview"
          className="mt-1 h-32 w-auto rounded object-cover border border-neutral-200"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      )}
      {value && mediaType === "video" && (
        <video
          src={value}
          controls={false}
          muted
          playsInline
          className="mt-1 h-32 w-auto rounded border border-neutral-200 object-cover"
          onError={(e) => ((e.currentTarget as HTMLVideoElement).style.display = "none")}
        />
      )}
    </div>
  );
}

export function AdminSiteContentForm({ items }: AdminSiteContentFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    items.reduce(
      (acc, item) => {
        acc[item.id] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    ),
  );
  const [isSaving, setIsSaving] = useState(false);

  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, SiteContentItem[]>,
  );

  const handleSave = async () => {
    setIsSaving(true);
    const updates = items
      .filter((item) => values[item.id] !== item.value)
      .map((item) => ({ id: item.id, value: values[item.id] }));

    if (updates.length === 0) {
      toast.info("No changes to save.");
      setIsSaving(false);
      return;
    }

    const res = await bulkUpdateSiteContent(updates);
    if (!res.success) {
      toast.error("Error saving content");
      setIsSaving(false);
      return;
    }
    toast.success(`${updates.length} item(s) updated successfully!`);
    setIsSaving(false);
  };

  const handleChange = (id: string, v: string) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="pt-3"
      >
        {Object.entries(grouped).map(([group, groupItems]) => (
          <div key={group} className="mb-8">
            <h3 className="text-lg font-semibold capitalize mb-4 text-black">
              {group.replace(/-/g, " ")}
            </h3>
            <AdminFieldGroup>
              <AdminFieldSet>
                <AdminFieldGroup>
                  {groupItems.map((item) => {
                    const isActive = item.key.endsWith("_active");
                    const isColor = item.key.endsWith("_color");
                    const isLong = (values[item.id] ?? "").length > 80;
                    const mediaType = getMediaType(item.key);

                    return (
                      <AdminField key={item.id}>
                        <AdminFieldLabel htmlFor={item.key}>
                          {item.label}
                        </AdminFieldLabel>

                        {isActive ? (
                          <ActiveToggle
                            id={item.key}
                            value={values[item.id] ?? "false"}
                            onChange={(v) => handleChange(item.id, v)}
                          />
                        ) : isColor ? (
                          <ColorField
                            id={item.key}
                            value={values[item.id] ?? "#000000"}
                            onChange={(v) => handleChange(item.id, v)}
                          />
                        ) : mediaType ? (
                          <MediaUploadField
                            id={item.key}
                            value={values[item.id] ?? ""}
                            mediaType={mediaType}
                            onChange={(v) => handleChange(item.id, v)}
                          />
                        ) : isLong ? (
                          <textarea
                            id={item.key}
                            className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 min-h-[80px]"
                            value={values[item.id] ?? ""}
                            onChange={(e) =>
                              handleChange(item.id, e.target.value)
                            }
                          />
                        ) : (
                          <AdminInput
                            id={item.key}
                            value={values[item.id] ?? ""}
                            onChange={(e) =>
                              handleChange(item.id, e.target.value)
                            }
                          />
                        )}
                      </AdminField>
                    );
                  })}
                </AdminFieldGroup>
              </AdminFieldSet>
            </AdminFieldGroup>
          </div>
        ))}
        <AdminButton type="submit" disabled={isSaving} className="mt-4">
          {isSaving ? "Saving..." : "Save All Changes"}
        </AdminButton>
      </form>
    </div>
  );
}
