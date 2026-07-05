"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  Search,
  MessageCircle,
  MapPin,
  HelpCircle,
  Code2,
  Eye,
  EyeOff,
  RotateCw,
  ExternalLink,
  Smartphone,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

import {
  AdminButton,
  AdminInput,
  AdminTagListField,
  PartnerLogosField,
} from "@/components/admin";
import {
  bulkUpdateSiteContent,
  deleteSiteContentById,
  upsertSiteContent,
} from "@/lib/server/actions";
import { SiteContentItem } from "@/types/client";

type BasicProduct = { id: string; name: string; images: string[] };

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

// ── Section / Group config ───────────────────────────────────────────────────

type SectionConfig = {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  groups: string[];
  /** Storefront route shown in the live-preview pane for this section. */
  previewPath: string;
};

const SECTION_CONFIG: SectionConfig[] = [
  {
    id: "homepage",
    label: "Home Page",
    shortLabel: "Home",
    icon: <Monitor size={14} />,
    description:
      "Hero banner, section headings, the home video, and feature cards.",
    groups: ["hero", "video-section", "home-page", "feature-cards"],
    previewPath: "/",
  },
  {
    id: "about",
    label: "About Page",
    shortLabel: "About",
    icon: <FileText size={14} />,
    description: "About page images, text, and feature highlights.",
    groups: ["about-images", "about-page", "about-features"],
    previewPath: "/about",
  },
  {
    id: "social",
    label: "Social & Contact",
    shortLabel: "Social",
    icon: <Globe size={14} />,
    description: "Social media links, contact email, phone, and newsletter.",
    groups: ["social-links", "newsletter"],
    previewPath: "/",
  },
  {
    id: "shipping",
    label: "Shipping & Delivery",
    shortLabel: "Shipping",
    icon: <Truck size={14} />,
    description: "Shipping charges and estimated delivery times.",
    groups: ["shipping", "delivery-estimates"],
    previewPath: "/checkout",
  },
  {
    id: "marquees",
    label: "Scrolling Bars",
    shortLabel: "Marquees",
    icon: <Megaphone size={14} />,
    description: "Announcement bar, product showcase strip, and partner logos.",
    groups: ["announcement-marquee", "product-marquee", "partner-logos-marquee"],
    previewPath: "/",
  },
  {
    id: "whatsapp",
    label: "WhatsApp Chat",
    shortLabel: "WhatsApp",
    icon: <MessageCircle size={14} />,
    description: "The floating WhatsApp chat button and its phone number.",
    groups: ["whatsapp-chat"],
    previewPath: "/",
  },
  {
    id: "location-support",
    label: "Location & FAQ",
    shortLabel: "Location",
    icon: <MapPin size={14} />,
    description: "Store location details and the support page FAQ.",
    groups: ["location", "support"],
    previewPath: "/location",
  },
];

const GROUP_META: Record<string, { label: string; icon: React.ReactNode }> = {
  "social-links": { label: "Social Links & Contact", icon: <Globe size={15} /> },
  hero: { label: "Hero Banner", icon: <ImageIcon size={15} /> },
  "home-page": { label: "Section Headings", icon: <Monitor size={15} /> },
  "video-section": { label: "Home Video", icon: <Video size={15} /> },
  "feature-cards": { label: "Feature Highlights", icon: <Star size={15} /> },
  "about-images": { label: "About Page Images", icon: <ImageIcon size={15} /> },
  "about-page": { label: "About Page Text", icon: <FileText size={15} /> },
  "about-features": { label: "About Features", icon: <Star size={15} /> },
  newsletter: { label: "Newsletter", icon: <Mail size={15} /> },
  shipping: { label: "Shipping Charges", icon: <Truck size={15} /> },
  "delivery-estimates": { label: "Delivery Estimates", icon: <Clock size={15} /> },
  "announcement-marquee": { label: "Announcement Bar", icon: <Megaphone size={15} /> },
  "product-marquee": { label: "Product Showcase", icon: <ShoppingBag size={15} /> },
  "partner-logos-marquee": { label: "Partner Logos", icon: <Handshake size={15} /> },
  "whatsapp-chat": { label: "WhatsApp Chat Button", icon: <MessageCircle size={15} /> },
  location: { label: "Location & Store Info", icon: <MapPin size={15} /> },
  support: { label: "Support FAQ", icon: <HelpCircle size={15} /> },
};

function getGroupMeta(group: string) {
  return (
    GROUP_META[group] ?? {
      label: group
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      icon: <Settings size={15} />,
    }
  );
}

// ── Aspect ratio helpers ─────────────────────────────────────────────────────

type AspectRatioOption = { label: string; value: number | undefined };
const ASPECT_OPTIONS: AspectRatioOption[] = [
  { label: "Free", value: undefined },
  { label: "Banner", value: 16 / 9 },
  { label: "Square", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "Portrait", value: 3 / 4 },
];

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
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
    const file = await cropImageToBlob(imgRef.current, completedCrop, fileName);
    await onUpload(file);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-900">Crop Image</h3>
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={onCancel}
            aria-label="Close"
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
      <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 w-fit">
        {(["preview", "url", "upload"] as MediaTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
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
                className="w-full rounded-lg border max-h-40"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Preview"
                className="w-full max-h-40 rounded-lg border object-cover"
              />
            )
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-gray-400 text-xs">
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
          role="button"
          tabIndex={0}
          aria-label={`Upload ${isVideo ? "video" : "image"} — drag & drop or activate to browse`}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
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
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
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
            <div className="space-y-1.5">
              <UploadCloud className="h-8 w-8 mx-auto text-gray-300" />
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
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-lg border-2 border-gray-200 p-0.5 bg-white"
        aria-label="Pick colour"
      />
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
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={isOn}
        onClick={() => onChange(isOn ? "false" : "true")}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
          isOn ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
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

// ── FaqField (structured Question | Answer editor) ───────────────────────────

type FaqRow = { q: string; a: string };

function parseFaq(value: string): FaqRow[] {
  return value
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const i = line.indexOf("|");
      if (i === -1) return { q: line.trim(), a: "" };
      return { q: line.slice(0, i).trim(), a: line.slice(i + 1).trim() };
    });
}

function FaqField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = parseFaq(value);
  const commit = (next: FaqRow[]) =>
    onChange(next.map((r) => `${r.q} | ${r.a}`).join("\n"));

  const update = (i: number, field: keyof FaqRow, val: string) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r));
    commit(next);
  };
  const add = () => commit([...rows, { q: "", a: "" }]);
  const remove = (i: number) => commit(rows.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-gray-400 italic">No FAQ entries yet.</p>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-600">
              {i + 1}
            </span>
            <input
              value={row.q}
              onChange={(e) => update(i, "q", e.target.value)}
              placeholder="Question"
              className="flex-1 text-sm font-medium rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronUp size={15} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label="Move down"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronDown size={15} />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Delete entry"
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <textarea
            value={row.a}
            onChange={(e) => update(i, "a", e.target.value)}
            placeholder="Answer"
            rows={2}
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 resize-y"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50 transition-all"
      >
        <Plus size={14} /> Add FAQ entry
      </button>
    </div>
  );
}

// ── ProductPickerField (replaces raw marquee_product_ids input) ──────────────

function ProductPickerField({
  value,
  onChange,
  products,
}: {
  value: string;
  onChange: (v: string) => void;
  products: BasicProduct[];
}) {
  const [search, setSearch] = useState("");

  const selectedIds = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const commit = (ids: string[]) => onChange(ids.join(","));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      commit(selectedIds.filter((s) => s !== id));
    } else {
      commit([...selectedIds, id]);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {/* Ordered selection with reorder controls */}
      {selectedIds.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">
            Showing {selectedIds.length} product
            {selectedIds.length !== 1 ? "s" : ""} — in this order
          </p>
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {selectedIds.map((id, i) => {
              const p = byId.get(id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 px-2.5 py-2 bg-white"
                >
                  <span className="text-xs font-semibold text-gray-400 w-5 text-center">
                    {i + 1}
                  </span>
                  {p?.images[0] ? (
                    <div className="relative w-9 h-11 shrink-0 overflow-hidden rounded bg-gray-100">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-11 shrink-0 rounded bg-gray-100" />
                  )}
                  <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">
                    {p?.name ?? (
                      <span className="text-amber-600 font-mono text-xs">
                        {id} (not found)
                      </span>
                    )}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === selectedIds.length - 1}
                      aria-label="Move down"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label="Remove"
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs text-gray-500">
          No products selected — the strip will automatically show the latest 12
          active products.
        </p>
      )}

      {/* Search + add */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add..."
          aria-label="Search products"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-56 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 p-3">No products found.</p>
        )}
        {filtered.map((p) => {
          const checked = selectedIds.includes(p.id);
          return (
            <label
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                checked ? "bg-gray-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p.id)}
                className="accent-gray-900 h-4 w-4 shrink-0"
              />
              {p.images[0] ? (
                <div className="relative w-7 h-9 shrink-0 overflow-hidden rounded bg-gray-100">
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-9 shrink-0 rounded bg-gray-100" />
              )}
              <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">
                {p.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── AddItemForm (dev-mode only) ──────────────────────────────────────────────

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
    onCreated({ id: res.data!.id, key: k, value: value.trim(), label: l, group });
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-700">Add New Content Item</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Key (unique ID)
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. hero_subtitle"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Label (display name)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Hero Subtitle"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Value
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Initial value"
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !key.trim() || !label.trim()}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center gap-2"
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
          className="px-4 py-2 border border-gray-200 text-sm text-gray-500 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── FieldRow (single item renderer — compact) ────────────────────────────────

function FieldRow({
  item,
  value,
  hasChange,
  devMode,
  products,
  onChange,
  onDelete,
  deleting,
}: {
  item: SiteContentItem;
  value: string;
  hasChange: boolean;
  devMode: boolean;
  products: BasicProduct[];
  onChange: (v: string) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const isActive = item.key.endsWith("_active") || item.key.endsWith("_enabled");
  const isColor = item.key.endsWith("_color");
  const isMedia = isMediaKey(item.key);
  const isPartnerLogos = item.key === "partners_logos";
  const isTagList = item.key === "announcement_texts";
  const isFaq = item.key === "support_faq";
  const isProductPicker = item.key === "marquee_product_ids";
  const isLong =
    !isMedia &&
    !isTagList &&
    !isPartnerLogos &&
    !isFaq &&
    !isProductPicker &&
    (value ?? "").length > 80;

  // Simple single-line controls can sit inline (label left, control right);
  // richer controls stack full-width.
  const isCompact =
    isActive ||
    isColor ||
    (!isMedia &&
      !isTagList &&
      !isPartnerLogos &&
      !isFaq &&
      !isProductPicker &&
      !isLong);

  const control = isActive ? (
    <ActiveToggle id={item.key} value={value ?? "false"} onChange={onChange} />
  ) : isColor ? (
    <ColorField id={item.key} value={value ?? "#000000"} onChange={onChange} />
  ) : isMedia ? (
    <MediaUploadField
      id={item.key}
      itemKey={item.key}
      value={value ?? ""}
      onChange={onChange}
    />
  ) : isProductPicker ? (
    <ProductPickerField
      value={value ?? ""}
      onChange={onChange}
      products={products}
    />
  ) : isFaq ? (
    <FaqField value={value ?? ""} onChange={onChange} />
  ) : isPartnerLogos ? (
    <PartnerLogosField value={value ?? ""} onChange={onChange} />
  ) : isTagList ? (
    <AdminTagListField id={item.key} value={value ?? ""} onChange={onChange} />
  ) : isLong ? (
    <textarea
      id={item.key}
      className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[72px] resize-y"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ) : (
    <AdminInput
      id={item.key}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div
      className={`relative px-3 sm:px-4 py-3 transition-colors ${
        hasChange ? "bg-amber-50/40" : ""
      }`}
    >
      {hasChange && (
        <span
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400"
          aria-hidden
        />
      )}
      <div
        className={
          isCompact
            ? "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            : "flex flex-col gap-2"
        }
      >
        <div
          className={`flex items-start justify-between gap-2 ${isCompact ? "sm:w-64 sm:shrink-0" : ""}`}
        >
          <div className="min-w-0">
            <label
              htmlFor={item.key}
              className="block text-sm font-medium text-gray-800 leading-snug"
            >
              {item.label}
            </label>
            {devMode && (
              <span className="text-[11px] text-gray-400 font-mono">
                {item.key}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasChange && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                title="Unsaved change"
                aria-label="Unsaved change"
              />
            )}
            {devMode && (
              <button
                type="button"
                title={`Delete "${item.label}"`}
                onClick={onDelete}
                disabled={deleting}
                className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
              </button>
            )}
          </div>
        </div>
        <div className={isCompact ? "flex-1 min-w-0" : ""}>{control}</div>
      </div>
    </div>
  );
}

// ── GroupCard (renders all items in a group) ─────────────────────────────────

function GroupCard({
  group,
  items,
  values,
  savedValues,
  deletingId,
  devMode,
  products,
  addingGroup,
  onChange,
  onDelete,
  onAddItem,
  onSetAddingGroup,
}: {
  group: string;
  items: SiteContentItem[];
  values: Record<string, string>;
  savedValues: Record<string, string>;
  deletingId: string | null;
  devMode: boolean;
  products: BasicProduct[];
  addingGroup: string | null;
  onChange: (id: string, v: string) => void;
  onDelete: (item: SiteContentItem) => void;
  onAddItem: (item: SiteContentItem) => void;
  onSetAddingGroup: (group: string | null) => void;
}) {
  const meta = getGroupMeta(group);
  const sectionChanges = items.filter(
    (item) => values[item.id] !== savedValues[item.id],
  ).length;

  const mediaItems = items.filter((item) => isMediaKey(item.key));
  const nonMediaItems = items.filter((item) => !isMediaKey(item.key));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Group header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 shrink-0">
            {meta.icon}
          </span>
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {meta.label}
          </h3>
        </div>
        {sectionChanges > 0 && (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
            {sectionChanges} unsaved
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Media items in a responsive grid */}
        {mediaItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-100 overflow-hidden"
              >
                <FieldRow
                  item={item}
                  value={values[item.id]}
                  hasChange={values[item.id] !== savedValues[item.id]}
                  devMode={devMode}
                  products={products}
                  onChange={(v) => onChange(item.id, v)}
                  onDelete={() => onDelete(item)}
                  deleting={deletingId === item.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Non-media items, divided rows for density */}
        {nonMediaItems.length > 0 && (
          <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {nonMediaItems.map((item) => (
              <FieldRow
                key={item.id}
                item={item}
                value={values[item.id]}
                hasChange={values[item.id] !== savedValues[item.id]}
                devMode={devMode}
                products={products}
                onChange={(v) => onChange(item.id, v)}
                onDelete={() => onDelete(item)}
                deleting={deletingId === item.id}
              />
            ))}
          </div>
        )}

        {/* Add item (dev mode only) */}
        {devMode &&
          (addingGroup === group ? (
            <AddItemForm
              group={group}
              onCreated={onAddItem}
              onCancel={() => onSetAddingGroup(null)}
            />
          ) : (
            <button
              type="button"
              onClick={() => onSetAddingGroup(group)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 transition-all"
            >
              <Plus size={13} /> Add item
            </button>
          ))}
      </div>
    </section>
  );
}

// ── PreviewPane ──────────────────────────────────────────────────────────────

const PREVIEW_ROUTES = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Location", path: "/location" },
  { label: "Support", path: "/support" },
  { label: "Checkout", path: "/checkout" },
];

function PreviewPane({
  path,
  onPathChange,
  reloadKey,
  dirty,
  onClose,
}: {
  path: string;
  onPathChange: (p: string) => void;
  reloadKey: number;
  dirty: boolean;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [localReload, setLocalReload] = useState(0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200"
        aria-label="Live preview"
      >
        {/* Preview header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <Eye size={15} className="text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-800">
              Live preview
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Device toggle */}
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                className={`p-1.5 rounded-md transition-colors ${
                  device === "desktop"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Monitor size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                className={`p-1.5 rounded-md transition-colors ${
                  device === "mobile"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Smartphone size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLocalReload((n) => n + 1)}
              aria-label="Refresh preview"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <RotateCw size={15} />
            </button>
            <a
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new tab"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink size={15} />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Hide preview"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Route selector */}
        <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-gray-100 scrollbar-hide">
          {PREVIEW_ROUTES.map((r) => (
            <button
              key={r.path}
              type="button"
              onClick={() => onPathChange(r.path)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                path === r.path
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {dirty && (
          <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-700">
            Preview shows <strong>saved</strong> content. Save to see your latest
            edits.
          </div>
        )}

        {/* Iframe */}
        <div className="flex-1 min-h-0 overflow-auto bg-gray-100 p-2 flex justify-center">
          <div
            className={
              device === "mobile"
                ? "w-[390px] shrink-0 h-full rounded-xl overflow-hidden border border-gray-300 bg-white shadow-sm"
                : "w-full h-full rounded-lg overflow-hidden bg-white"
            }
          >
            <iframe
              key={`${path}-${reloadKey}-${localReload}`}
              src={path}
              title="Storefront preview"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

type AdminSiteContentFormProps = {
  items: SiteContentItem[];
  products: BasicProduct[];
};

export function AdminSiteContentForm({
  items: initialItems,
  products,
}: AdminSiteContentFormProps) {
  const [allItems, setAllItems] = useState<SiteContentItem[]>(initialItems);
  const [activeSection, setActiveSection] = useState(SECTION_CONFIG[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [devMode, setDevMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPath, setPreviewPath] = useState(SECTION_CONFIG[0].previewPath);
  const [previewReload, setPreviewReload] = useState(0);

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

  const totalChanges = allItems.filter(
    (item) => values[item.id] !== savedValues[item.id],
  ).length;

  const handleSaveAll = useCallback(async () => {
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
    setPreviewReload((n) => n + 1); // refresh preview to reflect saved content
    toast.success(`${updates.length} item(s) updated`);
  }, [allItems, values, savedValues]);

  // Cmd/Ctrl+S saves everything.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!savingAll && totalChanges > 0) handleSaveAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSaveAll, savingAll, totalChanges]);

  const handleDiscard = () => {
    if (totalChanges === 0) return;
    if (!confirm(`Discard ${totalChanges} unsaved change(s)?`)) return;
    setValues({ ...savedValues });
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

  const currentSection =
    SECTION_CONFIG.find((s) => s.id === activeSection) ?? SECTION_CONFIG[0];
  const activeGroups = currentSection.groups.filter((g) => grouped[g]?.length);

  // Groups not assigned to any section.
  const allSectionGroups = SECTION_CONFIG.flatMap((s) => s.groups);
  const otherGroups = Object.keys(grouped).filter(
    (g) => !allSectionGroups.includes(g),
  );

  const selectSection = (id: string) => {
    setActiveSection(id);
    const sec = SECTION_CONFIG.find((s) => s.id === id);
    if (sec) setPreviewPath(sec.previewPath);
    setSearchQuery("");
  };

  // Per-section change counts.
  const sectionChangeCounts = SECTION_CONFIG.reduce(
    (acc, section) => {
      let count = 0;
      for (const group of section.groups) {
        if (grouped[group]) {
          count += grouped[group].filter(
            (item) => values[item.id] !== savedValues[item.id],
          ).length;
        }
      }
      acc[section.id] = count;
      return acc;
    },
    {} as Record<string, number>,
  );

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

  return (
    <div className="pb-10">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 -mx-1 px-1 py-3 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <label htmlFor="site-content-search" className="sr-only">
              Search content
            </label>
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="site-content-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all content..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Dev mode */}
            <button
              type="button"
              onClick={() => setDevMode((d) => !d)}
              aria-pressed={devMode}
              title="Show technical keys, delete and add-item controls"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                devMode
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:text-gray-700"
              }`}
            >
              <Code2 size={14} />
              <span className="hidden md:inline">Developer</span>
            </button>

            {/* Preview toggle */}
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              aria-pressed={showPreview}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                showPreview
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:text-gray-700"
              }`}
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">
                {showPreview ? "Hide preview" : "Preview"}
              </span>
            </button>

            {/* Discard */}
            {totalChanges > 0 && (
              <button
                type="button"
                onClick={handleDiscard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 bg-white hover:text-gray-700 transition-colors"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Discard</span>
              </button>
            )}

            {/* Save all */}
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
                  {totalChanges > 0 ? `Save (${totalChanges})` : "Saved"}
                </span>
              )}
            </AdminButton>
          </div>
        </div>
      </div>

      {/* ── Pill tab navigation ── */}
      {!isSearching && (
        <div
          role="tablist"
          aria-label="Content sections"
          className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
        >
          {SECTION_CONFIG.map((section) => {
            const isActive = activeSection === section.id;
            const changes = sectionChangeCounts[section.id] ?? 0;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectSection(section.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 ${
                  isActive
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm shadow-gray-900/20"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span
                  className={
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-600 transition-colors"
                  }
                >
                  {section.icon}
                </span>
                <span className="hidden sm:inline">{section.label}</span>
                <span className="sm:hidden">{section.shortLabel}</span>
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
      )}

      {/* ── Body: editor (full width) + preview overlay ── */}
      <div className="mt-5">
        {/* Editor column */}
        <div className="min-w-0">
          {/* Search results */}
          {isSearching ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}
                &quot;
              </p>
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No items found</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                  {searchResults.map((item) => (
                    <FieldRow
                      key={item.id}
                      item={item}
                      value={values[item.id]}
                      hasChange={values[item.id] !== savedValues[item.id]}
                      devMode={devMode}
                      products={products}
                      onChange={(v) => handleChange(item.id, v)}
                      onDelete={() => handleDelete(item)}
                      deleting={deletingId === item.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Section description */}
              <p className="text-sm text-gray-500">
                {currentSection.description}
              </p>

              {activeGroups.map((group) => (
                <GroupCard
                  key={group}
                  group={group}
                  items={grouped[group]}
                  values={values}
                  savedValues={savedValues}
                  deletingId={deletingId}
                  devMode={devMode}
                  products={products}
                  addingGroup={addingGroup}
                  onChange={handleChange}
                  onDelete={handleDelete}
                  onAddItem={handleItemCreated}
                  onSetAddingGroup={setAddingGroup}
                />
              ))}

              {/* "Other" groups shown on the last section */}
              {activeSection === SECTION_CONFIG[SECTION_CONFIG.length - 1].id &&
                otherGroups.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Other Settings
                    </h3>
                    {otherGroups.map((group) => (
                      <GroupCard
                        key={group}
                        group={group}
                        items={grouped[group]}
                        values={values}
                        savedValues={savedValues}
                        deletingId={deletingId}
                        devMode={devMode}
                        products={products}
                        addingGroup={addingGroup}
                        onChange={handleChange}
                        onDelete={handleDelete}
                        onAddItem={handleItemCreated}
                        onSetAddingGroup={setAddingGroup}
                      />
                    ))}
                  </div>
                )}

              {activeGroups.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Settings size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    No content items in this section yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview pane */}
        {showPreview && (
          <PreviewPane
            path={previewPath}
            onPathChange={setPreviewPath}
            reloadKey={previewReload}
            dirty={totalChanges > 0}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
}
