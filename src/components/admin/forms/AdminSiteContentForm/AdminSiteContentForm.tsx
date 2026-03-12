"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Globe,
  ImageIcon,
  Monitor,
  Star,
  FileText,
  Settings,
  Loader2,
  Video,
  Link2 as LinkIcon,
  Plus,
  Trash2,
  X,
  Mail,
  Truck,
  Clock,
  Megaphone,
  ShoppingBag,
  Handshake,
  UploadCloud,
  Crop as CropIcon,
  Save,
  Check,
  Search,
  MessageCircle,
} from "lucide-react";

import { AdminButton, AdminInput } from "@/components/admin";
import {
  bulkUpdateSiteContent,
  deleteSiteContentById,
  upsertSiteContent,
} from "@/lib/server/actions";
import { SiteContentItem } from "@/types/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

function isMediaKey(key: string): boolean {
  return (
    key.includes("_image") ||
    key.includes("_video") ||
    key.endsWith("_mp4") ||
    key.endsWith("_webm") ||
    key.endsWith("_logo")
  );
}

// ── Tab / Group config ───────────────────────────────────────────────────────

type TabConfig = {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  groups: string[];
};

const TAB_CONFIG: TabConfig[] = [
  {
    id: "homepage",
    label: "Home Page",
    shortLabel: "Home",
    icon: <Monitor size={18} />,
    description:
      "Manage your homepage hero banner, headings, videos, and feature cards.",
    groups: ["hero", "video-section", "home-page", "feature-cards"],
  },
  {
    id: "about",
    label: "About Page",
    shortLabel: "About",
    icon: <FileText size={18} />,
    description: "Update your about page images, text, and feature highlights.",
    groups: ["about-images", "about-page", "about-features"],
  },
  {
    id: "social",
    label: "Social & Contact",
    shortLabel: "Social",
    icon: <Globe size={18} />,
    description: "Manage social media links, email, and contact information.",
    groups: ["social-links", "newsletter"],
  },
  {
    id: "shipping",
    label: "Shipping & Delivery",
    shortLabel: "Shipping",
    icon: <Truck size={18} />,
    description: "Set shipping charges and estimated delivery times.",
    groups: ["shipping", "delivery-estimates"],
  },
  {
    id: "marquees",
    label: "Scrolling Bars",
    shortLabel: "Marquees",
    icon: <Megaphone size={18} />,
    description:
      "Configure the announcement bar, product showcase, and partner logos.",
    groups: [
      "announcement-marquee",
      "product-marquee",
      "partner-logos-marquee",
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp Chat",
    shortLabel: "WhatsApp",
    icon: <MessageCircle size={18} />,
    description:
      "Toggle the floating WhatsApp chat button and set the phone number.",
    groups: ["whatsapp-chat"],
  },
];

const GROUP_META: Record<string, { label: string; icon: React.ReactNode }> = {
  "social-links": {
    label: "Social Links & Contact",
    icon: <Globe size={16} />,
  },
  hero: { label: "Hero Banner", icon: <ImageIcon size={16} /> },
  "home-page": { label: "Section Headings", icon: <Monitor size={16} /> },
  "video-section": { label: "Home Video", icon: <Video size={16} /> },
  "feature-cards": {
    label: "Feature Highlights",
    icon: <Star size={16} />,
  },
  "about-images": {
    label: "About Page Images",
    icon: <ImageIcon size={16} />,
  },
  "about-page": { label: "About Page Text", icon: <FileText size={16} /> },
  "about-features": { label: "About Features", icon: <Star size={16} /> },
  newsletter: { label: "Newsletter", icon: <Mail size={16} /> },
  shipping: { label: "Shipping Charges", icon: <Truck size={16} /> },
  "delivery-estimates": {
    label: "Delivery Estimates",
    icon: <Clock size={16} />,
  },
  "announcement-marquee": {
    label: "Announcement Bar",
    icon: <Megaphone size={16} />,
  },
  "product-marquee": {
    label: "Product Showcase",
    icon: <ShoppingBag size={16} />,
  },
  "partner-logos-marquee": {
    label: "Partner Logos",
    icon: <Handshake size={16} />,
  },
  "whatsapp-chat": {
    label: "WhatsApp Chat Button",
    icon: <MessageCircle size={16} />,
  },
};

function getGroupMeta(group: string) {
  return (
    GROUP_META[group] ?? {
      label: group
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      icon: <Settings size={16} />,
    }
  );
}

// ── Aspect ratio helpers ─────────────────────────────────────────────────────

type AspectRatioOption = {
  label: string;
  value: number | undefined;
  css: string;
};
const ASPECT_OPTIONS: AspectRatioOption[] = [
  { label: "Free", value: undefined, css: "" },
  { label: "Banner", value: 16 / 9, css: "aspect-video" },
  { label: "Square", value: 1, css: "aspect-square" },
  { label: "4:3", value: 4 / 3, css: "aspect-[4/3]" },
  { label: "Portrait", value: 3 / 4, css: "aspect-[3/4]" },
];

function centerAspectCrop(
  width: number,
  height: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
    width,
    height,
  );
}

function cropImageToBlob(
  imgEl: HTMLImageElement,
  pixelCrop: PixelCrop,
  fileName: string,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;
  ctx.drawImage(
    imgEl,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Canvas empty"));
        resolve(
          new File([blob], fileName.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
          }),
        );
      },
      "image/webp",
      0.92,
    ),
  );
}

// ── CropModal ────────────────────────────────────────────────────────────────

function CropModal({
  src,
  fileName,
  uploading,
  onUpload,
  onCancel,
}: {
  src: string;
  fileName: string;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (aspect !== undefined) {
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleCropAndUpload = async () => {
    if (!imgRef.current || !completedCrop) {
      if (!src) return;
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], fileName.replace(/\.[^.]+$/, ".webp"), {
        type: "image/webp",
      });
      await onUpload(file);
      return;
    }
    const file = await cropImageToBlob(
      imgRef.current,
      completedCrop,
      fileName,
    );
    await onUpload(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-900">Crop Image</h3>
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setAspect(opt.value);
                if (imgRef.current && opt.value !== undefined) {
                  const { width, height } = imgRef.current;
                  setCrop(centerAspectCrop(width, height, opt.value));
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                aspect === opt.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="overflow-auto flex-1 flex justify-center rounded-xl bg-gray-50 border p-2">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-w-full max-h-[50vh]"
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={handleCropAndUpload}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CropIcon className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Crop & Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MediaUploadField ─────────────────────────────────────────────────────────

type MediaTab = "preview" | "url" | "upload";

function MediaUploadField({
  id,
  itemKey,
  value,
  onChange,
}: {
  id: string;
  itemKey: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isVideo =
    (itemKey.includes("video") && !itemKey.endsWith("_poster")) ||
    itemKey.endsWith("_mp4") ||
    itemKey.endsWith("_webm");
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [tab, setTab] = useState<MediaTab>(value ? "preview" : "upload");
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("image.webp");
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeLabel = isVideo ? "200 MB" : "50 MB";
  const maxSizeBytes = isVideo ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
  const acceptTypes = isVideo
    ? "video/mp4,video/webm,video/quicktime"
    : "image/jpeg,image/png,image/webp,image/avif,image/gif";
  const formatHint = isVideo ? "MP4, WebM, MOV" : "JPG, PNG, WebP, AVIF, GIF";

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/site-content/upload", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        onChange(json.url);
        setTab("preview");
        toast.success("Uploaded successfully");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleFile = (file: File) => {
    if (file.size > maxSizeBytes) {
      toast.error(`File too large — max ${maxSizeLabel}`);
      return;
    }
    if (isVideo) {
      uploadFile(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
      setCropFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {cropSrc && (
        <CropModal
          src={cropSrc}
          fileName={cropFileName}
          uploading={uploading}
          onUpload={async (file) => {
            setCropSrc(null);
            await uploadFile(file);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {(["preview", "url", "upload"] as MediaTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "preview" ? "Preview" : t === "url" ? "Use URL" : "Upload"}
          </button>
        ))}
      </div>

      {tab === "preview" && (
        <div>
          {value ? (
            isVideo ? (
              <video
                src={value}
                controls
                className="w-full rounded-xl border max-h-48"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Preview"
                className="w-full max-h-48 rounded-xl border object-cover"
              />
            )
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
              No media uploaded yet
            </div>
          )}
        </div>
      )}

      {tab === "url" && (
        <div className="flex gap-2">
          <AdminInput
            id={id}
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <AdminButton
            type="button"
            variant="secondary"
            disabled={!urlDraft}
            onClick={() => {
              onChange(urlDraft);
              setUrlDraft("");
              setTab("preview");
            }}
          >
            <LinkIcon className="h-4 w-4 mr-1" /> Set
          </AdminButton>
        </div>
      )}

      {tab === "upload" && (
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 hover:border-gray-400 hover:bg-gray-50/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="h-10 w-10 mx-auto text-gray-300" />
              <p className="text-sm font-medium text-gray-600">
                Drag & drop or{" "}
                <span className="text-gray-900 underline">browse files</span>
              </p>
              <p className="text-xs text-gray-400">
                {formatHint} — up to {maxSizeLabel}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ColorField ───────────────────────────────────────────────────────────────

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
      <div className="relative">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-xl border-2 border-gray-200 p-1 bg-white"
          aria-label="Pick colour"
        />
      </div>
      <AdminInput
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-sm"
        placeholder="#000000"
      />
    </div>
  );
}

// ── ActiveToggle ─────────────────────────────────────────────────────────────

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
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
          isOn ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            isOn ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium select-none ${isOn ? "text-green-700" : "text-gray-500"}`}
      >
        {isOn ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

// ── AddItemForm ──────────────────────────────────────────────────────────────

function AddItemForm({
  group,
  onCreated,
  onCancel,
}: {
  group: string;
  onCreated: (item: SiteContentItem) => void;
  onCancel: () => void;
}) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const k = key.trim().toLowerCase().replace(/\s+/g, "_");
    const l = label.trim();
    if (!k || !l) {
      toast.error("Key and label are required");
      return;
    }
    setSaving(true);
    const res = await upsertSiteContent(k, value.trim(), l, group);
    setSaving(false);
    if (!res.success) {
      toast.error("Failed to create item");
      return;
    }
    toast.success("Item created");
    onCreated({
      id: res.data!.id,
      key: k,
      value: value.trim(),
      label: l,
      group,
    });
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-700">
        Add New Content Item
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Key (unique ID)
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. hero_subtitle"
            className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Label (display name)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Hero Subtitle"
            className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Value
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Initial value"
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !key.trim() || !label.trim()}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center gap-2"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          {saving ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 text-sm text-gray-500 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── ContentField (single item renderer) ──────────────────────────────────────

function ContentField({
  item,
  value,
  hasChange,
  onChange,
  onDelete,
  deleting,
}: {
  item: SiteContentItem;
  value: string;
  hasChange: boolean;
  onChange: (v: string) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const isActive = item.key.endsWith("_active") || item.key.endsWith("_enabled");
  const isColor = item.key.endsWith("_color");
  const isMedia = isMediaKey(item.key);
  const isLong = !isMedia && (value ?? "").length > 80;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        hasChange
          ? "border-amber-300 bg-amber-50/40 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <label
            htmlFor={item.key}
            className="block text-sm font-semibold text-gray-800"
          >
            {item.label}
          </label>
          <span className="text-[11px] text-gray-400 font-mono">
            {item.key}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasChange && (
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              unsaved
            </span>
          )}
          <button
            type="button"
            title={`Delete "${item.label}"`}
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {isActive ? (
        <ActiveToggle
          id={item.key}
          value={value ?? "false"}
          onChange={onChange}
        />
      ) : isColor ? (
        <ColorField
          id={item.key}
          value={value ?? "#000000"}
          onChange={onChange}
        />
      ) : isMedia ? (
        <MediaUploadField
          id={item.key}
          itemKey={item.key}
          value={value ?? ""}
          onChange={onChange}
        />
      ) : isLong ? (
        <textarea
          id={item.key}
          className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[80px] resize-y"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <AdminInput
          id={item.key}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ── GroupSection (renders all items in a group) ──────────────────────────────

function GroupSection({
  group,
  items,
  values,
  savedValues,
  savingGroup,
  deletingId,
  addingGroup,
  onChange,
  onSaveGroup,
  onDelete,
  onAddItem,
  onSetAddingGroup,
}: {
  group: string;
  items: SiteContentItem[];
  values: Record<string, string>;
  savedValues: Record<string, string>;
  savingGroup: string | null;
  deletingId: string | null;
  addingGroup: string | null;
  onChange: (id: string, v: string) => void;
  onSaveGroup: (group: string, items: SiteContentItem[]) => void;
  onDelete: (item: SiteContentItem) => void;
  onAddItem: (item: SiteContentItem) => void;
  onSetAddingGroup: (group: string | null) => void;
}) {
  const meta = getGroupMeta(group);
  const sectionChanges = items.filter(
    (item) => values[item.id] !== savedValues[item.id],
  ).length;

  // Separate media items for grid layout
  const mediaItems = items.filter((item) => isMediaKey(item.key));
  const nonMediaItems = items.filter((item) => !isMediaKey(item.key));

  return (
    <div className="space-y-4">
      {/* Group header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
            {meta.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {meta.label}
            </h3>
            <span className="text-xs text-gray-400">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={sectionChanges === 0 || savingGroup === group}
          onClick={() => onSaveGroup(group, items)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            sectionChanges > 0
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-400 cursor-default"
          }`}
        >
          {savingGroup === group ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Saving...
            </span>
          ) : sectionChanges > 0 ? (
            <span className="flex items-center gap-1.5">
              <Save size={12} />
              Save ({sectionChanges})
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Check size={12} />
              Saved
            </span>
          )}
        </button>
      </div>

      {/* Media items in a responsive grid */}
      {mediaItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mediaItems.map((item) => (
            <ContentField
              key={item.id}
              item={item}
              value={values[item.id]}
              hasChange={values[item.id] !== savedValues[item.id]}
              onChange={(v) => onChange(item.id, v)}
              onDelete={() => onDelete(item)}
              deleting={deletingId === item.id}
            />
          ))}
        </div>
      )}

      {/* Non-media items */}
      <div className="space-y-3">
        {nonMediaItems.map((item) => (
          <ContentField
            key={item.id}
            item={item}
            value={values[item.id]}
            hasChange={values[item.id] !== savedValues[item.id]}
            onChange={(v) => onChange(item.id, v)}
            onDelete={() => onDelete(item)}
            deleting={deletingId === item.id}
          />
        ))}
      </div>

      {/* Add item */}
      {addingGroup === group ? (
        <AddItemForm
          group={group}
          onCreated={onAddItem}
          onCancel={() => onSetAddingGroup(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => onSetAddingGroup(group)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 transition-all"
        >
          <Plus size={14} /> Add item
        </button>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

type AdminSiteContentFormProps = {
  items: SiteContentItem[];
};

export function AdminSiteContentForm({
  items: initialItems,
}: AdminSiteContentFormProps) {
  const [allItems, setAllItems] = useState<SiteContentItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const buildInitial = (list: SiteContentItem[]) =>
    list.reduce(
      (acc, item) => {
        acc[item.id] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    );

  const [values, setValues] = useState<Record<string, string>>(
    buildInitial(initialItems),
  );
  const [savedValues, setSavedValues] = useState<Record<string, string>>(
    buildInitial(initialItems),
  );
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState<string | null>(null);

  const grouped = allItems.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, SiteContentItem[]>,
  );

  const handleChange = (id: string, v: string) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  const applyUpdates = (updates: { id: string; value: string }[]) => {
    setSavedValues((prev) => {
      const next = { ...prev };
      updates.forEach((u) => (next[u.id] = u.value));
      return next;
    });
  };

  const handleSaveGroup = async (
    group: string,
    groupItems: SiteContentItem[],
  ) => {
    const updates = groupItems
      .filter((item) => values[item.id] !== savedValues[item.id])
      .map((item) => ({ id: item.id, value: values[item.id] }));
    if (updates.length === 0) {
      toast.info("No changes in this section.");
      return;
    }
    setSavingGroup(group);
    const res = await bulkUpdateSiteContent(updates);
    setSavingGroup(null);
    if (!res.success) {
      toast.error("Error saving section");
      return;
    }
    applyUpdates(updates);
    toast.success(`${updates.length} item(s) saved`);
  };

  const handleSaveAll = async () => {
    const updates = allItems
      .filter((item) => values[item.id] !== savedValues[item.id])
      .map((item) => ({ id: item.id, value: values[item.id] }));
    if (updates.length === 0) {
      toast.info("No changes to save.");
      return;
    }
    setSavingAll(true);
    const res = await bulkUpdateSiteContent(updates);
    setSavingAll(false);
    if (!res.success) {
      toast.error("Error saving content");
      return;
    }
    applyUpdates(updates);
    toast.success(`${updates.length} item(s) updated`);
  };

  const handleDelete = async (item: SiteContentItem) => {
    if (
      !confirm(
        `Delete "${item.label}"?\n\nKey: ${item.key}\nThis cannot be undone.`,
      )
    )
      return;
    setDeletingId(item.id);
    const res = await deleteSiteContentById(item.id);
    setDeletingId(null);
    if (!res.success) {
      toast.error("Failed to delete item");
      return;
    }
    setAllItems((prev) => prev.filter((i) => i.id !== item.id));
    setValues((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setSavedValues((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    toast.success(`"${item.label}" deleted`);
  };

  const handleItemCreated = (newItem: SiteContentItem) => {
    setAllItems((prev) => [...prev, newItem]);
    setValues((prev) => ({ ...prev, [newItem.id]: newItem.value }));
    setSavedValues((prev) => ({ ...prev, [newItem.id]: newItem.value }));
    setAddingGroup(null);
  };

  const totalChanges = allItems.filter(
    (item) => values[item.id] !== savedValues[item.id],
  ).length;

  // Get current active tab config
  const currentTab =
    TAB_CONFIG.find((t) => t.id === activeTab) ?? TAB_CONFIG[0];

  // Groups for the active tab, filtered to only those with items
  const activeGroups = currentTab.groups.filter((g) => grouped[g]?.length);

  // Collect "other" groups not assigned to any tab
  const allTabGroups = TAB_CONFIG.flatMap((t) => t.groups);
  const otherGroups = Object.keys(grouped).filter(
    (g) => !allTabGroups.includes(g),
  );

  // Search mode
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (values[item.id] ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : [];

  // Tab change counts per tab
  const tabChangeCounts = TAB_CONFIG.reduce(
    (acc, tab) => {
      let count = 0;
      for (const group of tab.groups) {
        if (grouped[group]) {
          count += grouped[group].filter(
            (item) => values[item.id] !== savedValues[item.id],
          ).length;
        }
      }
      acc[tab.id] = count;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="pb-10">
      {/* ── Top bar: search + save all ── */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-3 bg-gray-50/95 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Save all + changes counter */}
          <div className="flex items-center gap-3">
            {totalChanges > 0 && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                {totalChanges} unsaved change{totalChanges !== 1 ? "s" : ""}
              </span>
            )}
            <AdminButton
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll || totalChanges === 0}
              className="whitespace-nowrap"
            >
              {savingAll ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={14} />
                  Save All
                </span>
              )}
            </AdminButton>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      {!isSearching && (
        <div className="mt-4 mb-6">
          {/* Desktop tabs */}
          <div className="hidden md:flex gap-1 rounded-2xl bg-gray-100 p-1.5">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              const changes = tabChangeCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                >
                  <span className="hidden lg:inline">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {changes > 0 && (
                    <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {changes}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile tabs - horizontal scroll */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              const changes = tabChangeCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.shortLabel}</span>
                  {changes > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {changes}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab description ── */}
      {!isSearching && currentTab.description && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50/50 border border-blue-100">
          <p className="text-sm text-blue-700">{currentTab.description}</p>
        </div>
      )}

      {/* ── Search results ── */}
      {isSearching && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            {searchResults.length} result
            {searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}
            &quot;
          </p>
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            searchResults.map((item) => (
              <ContentField
                key={item.id}
                item={item}
                value={values[item.id]}
                hasChange={values[item.id] !== savedValues[item.id]}
                onChange={(v) => handleChange(item.id, v)}
                onDelete={() => handleDelete(item)}
                deleting={deletingId === item.id}
              />
            ))
          )}
        </div>
      )}

      {/* ── Tab content (group sections) ── */}
      {!isSearching && (
        <div className="space-y-8">
          {activeGroups.map((group) => (
            <GroupSection
              key={group}
              group={group}
              items={grouped[group]}
              values={values}
              savedValues={savedValues}
              savingGroup={savingGroup}
              deletingId={deletingId}
              addingGroup={addingGroup}
              onChange={handleChange}
              onSaveGroup={handleSaveGroup}
              onDelete={handleDelete}
              onAddItem={handleItemCreated}
              onSetAddingGroup={setAddingGroup}
            />
          ))}

          {/* "Other" groups shown on the last tab */}
          {activeTab === TAB_CONFIG[TAB_CONFIG.length - 1].id &&
            otherGroups.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Other Settings
                </h2>
                <div className="space-y-8">
                  {otherGroups.map((group) => (
                    <GroupSection
                      key={group}
                      group={group}
                      items={grouped[group]}
                      values={values}
                      savedValues={savedValues}
                      savingGroup={savingGroup}
                      deletingId={deletingId}
                      addingGroup={addingGroup}
                      onChange={handleChange}
                      onSaveGroup={handleSaveGroup}
                      onDelete={handleDelete}
                      onAddItem={handleItemCreated}
                      onSetAddingGroup={setAddingGroup}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Empty state */}
          {activeGroups.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Settings size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No content items in this section yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
