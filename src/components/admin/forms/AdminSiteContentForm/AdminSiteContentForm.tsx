"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
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
  ChevronDown,
  ChevronRight,
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
} from "lucide-react";

import { AdminButton, AdminInput } from "@/components/admin";
import {
  bulkUpdateSiteContent,
  deleteSiteContentById,
  upsertSiteContent,
} from "@/lib/server/actions";
import { SiteContentItem } from "@/types/client";

// -- helpers -------------------------------------------------------------------

function isMediaKey(key: string): boolean {
  return (
    key.includes("_image") ||
    key.includes("_video") ||
    key.endsWith("_mp4") ||
    key.endsWith("_webm") ||
    key.endsWith("_logo")
  );
}

const GROUP_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; description: string }
> = {
  "social-links": {
    label: "Social Links & Contact",
    icon: <Globe size={16} />,
    description:
      "Contact info and social media links shown in the footer and about page.",
  },
  hero: {
    label: "Hero Section",
    icon: <ImageIcon size={16} />,
    description: "Main banner image and text at the top of the home page.",
  },
  "home-page": {
    label: "Home Page — Section Headings",
    icon: <Monitor size={16} />,
    description: "New arrivals, collections, and news section headings.",
  },
  "video-section": {
    label: "Home Video",
    icon: <Video size={16} />,
    description: "The full-width video on the home page. Upload MP4/WebM and set the poster image.",
  },
  "feature-cards": {
    label: "Feature Cards",
    icon: <Star size={16} />,
    description: "The three feature highlight cards on the home page.",
  },
  "about-images": {
    label: "About Page Images",
    icon: <ImageIcon size={16} />,
    description: "Images displayed on the About Us page.",
  },
  "about-page": {
    label: "About Page Text",
    icon: <FileText size={16} />,
    description: "Text content for the About page.",
  },
  "about-features": {
    label: "About Page Features",
    icon: <Star size={16} />,
    description: "Feature cards shown on the About page.",
  },
  newsletter: {
    label: "Newsletter",
    icon: <Mail size={16} />,
    description: "Newsletter heading and description text.",
  },
  shipping: {
    label: "Shipping",
    icon: <Truck size={16} />,
    description: "Shipping charge settings.",
  },
  "delivery-estimates": {
    label: "Delivery Estimates",
    icon: <Clock size={16} />,
    description: "Estimated delivery times shown on order pages.",
  },
  "announcement-marquee": {
    label: "Announcement Marquee",
    icon: <Megaphone size={16} />,
    description: "Top-of-page scrolling announcement bar.",
  },
  "product-marquee": {
    label: "Product Marquee",
    icon: <ShoppingBag size={16} />,
    description: "Scrolling product image marquee on the home page.",
  },
  "partner-logos-marquee": {
    label: "Partner Logos Marquee",
    icon: <Handshake size={16} />,
    description: "Scrolling partner brand logos on the home page.",
  },
};

function getGroupConfig(group: string) {
  return (
    GROUP_CONFIG[group] ?? {
      label: group
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      icon: <Settings size={16} />,
      description: "",
    }
  );
}

// -- MediaUploadField ----------------------------------------------------------

type MediaTab = "preview" | "url" | "upload";

type AspectRatioOption = { label: string; value: number | undefined; css: string };
const ASPECT_OPTIONS: AspectRatioOption[] = [
  { label: "Free",     value: undefined, css: "" },
  { label: "Banner",   value: 16 / 9,    css: "aspect-video" },
  { label: "Square",   value: 1,         css: "aspect-square" },
  { label: "4:3",      value: 4 / 3,     css: "aspect-[4/3]" },
  { label: "Portrait", value: 3 / 4,     css: "aspect-[3/4]" },
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

  // crop state (images only)
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("image.webp");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
  const cropImgRef = useRef<HTMLImageElement>(null);

  // preview aspect ratio
  const [previewAspect, setPreviewAspect] = useState<AspectRatioOption>(
    ASPECT_OPTIONS[1], // Banner by default
  );

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
      toast.error(`File too large - maximum is ${maxSizeLabel}`);
      return;
    }
    if (isVideo) {
      uploadFile(file);
      return;
    }
    // For images: open crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
      setCropFileName(file.name);
      setCrop(undefined);
      setCompletedCrop(null);
      setCropAspect(ASPECT_OPTIONS[0].value); // start as Free
    };
    reader.readAsDataURL(file);
  };

  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (cropAspect !== undefined) {
      setCrop(centerAspectCrop(width, height, cropAspect));
    }
  };

  const handleCropAndUpload = async () => {
    if (!cropImgRef.current || !completedCrop) {
      // No crop drawn - upload the original src as-is via blob
      if (!cropSrc) return;
      const res = await fetch(cropSrc);
      const blob = await res.blob();
      const file = new File([blob], cropFileName.replace(/\.[^.]+$/, ".webp"), {
        type: "image/webp",
      });
      setCropSrc(null);
      await uploadFile(file);
      return;
    }
    const file = await cropImageToBlob(
      cropImgRef.current,
      completedCrop,
      cropFileName,
    );
    setCropSrc(null);
    await uploadFile(file);
  };

  return (
    <div className="space-y-2">
      {/* Crop modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Crop Image</h3>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setCropSrc(null)}
              >
                Cancel
              </button>
            </div>

            {/* Aspect ratio lock pills */}
            <div className="flex flex-wrap gap-2">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setCropAspect(opt.value);
                    if (cropImgRef.current && opt.value !== undefined) {
                      const { width, height } = cropImgRef.current;
                      setCrop(centerAspectCrop(width, height, opt.value));
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    cropAspect === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Crop area */}
            <div className="overflow-auto max-h-[55vh] flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={cropAspect}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={cropImgRef}
                  src={cropSrc}
                  alt="Crop preview"
                  onLoad={onCropImageLoad}
                  className="max-w-full"
                />
              </ReactCrop>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md border text-sm hover:bg-muted"
                onClick={() => setCropSrc(null)}
              >
                Cancel
              </button>
              <AdminButton
                type="button"
                disabled={uploading}
                onClick={handleCropAndUpload}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CropIcon className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Crop & Upload"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-md border p-1 w-fit">
        {(["preview", "url", "upload"] as MediaTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "preview" ? "Preview" : t === "url" ? "Use URL" : "Upload File"}
          </button>
        ))}
      </div>

      {/* Preview tab */}
      {tab === "preview" && (
        <div className="space-y-2">
          {value ? (
            <>
              {/* Aspect ratio pills for preview */}
              {!isVideo && (
                <div className="flex flex-wrap gap-1.5">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setPreviewAspect(opt)}
                      className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                        previewAspect.label === opt.label
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {isVideo ? (
                <video
                  src={value}
                  controls
                  className="w-full rounded-md border max-h-52"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value}
                  alt="Preview"
                  className={`w-full rounded-md border object-cover ${previewAspect.css}`}
                />
              )}
            </>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
              No media selected
            </div>
          )}
        </div>
      )}

      {/* Use URL tab */}
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
            <LinkIcon className="h-4 w-4 mr-1" /> Use
          </AdminButton>
        </div>
      )}

      {/* Upload File tab */}
      {tab === "upload" && (
        <div
          className={`rounded-md border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag & drop or{" "}
                <span className="text-primary underline">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatHint} up to {maxSizeLabel}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -- ColorField ----------------------------------------------------------------

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

// -- ActiveToggle --------------------------------------------------------------

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

// -- AddItemForm (inline per-section) -----------------------------------------

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
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        New Content Item
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Key (unique ID)</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. hero_subtitle"
            className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Label (shown in admin)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Hero Subtitle"
            className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Value</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Initial value (can be edited after)"
          className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !key.trim() || !label.trim()}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {saving ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 border border-gray-200 text-sm text-gray-500 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        >
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// -- AdminSiteContentForm ------------------------------------------------------

type AdminSiteContentFormProps = {
  items: SiteContentItem[];
};

export function AdminSiteContentForm({ items: initialItems }: AdminSiteContentFormProps) {
  const [allItems, setAllItems] = useState<SiteContentItem[]>(initialItems);

  const buildInitial = (list: SiteContentItem[]) =>
    list.reduce(
      (acc, item) => {
        acc[item.id] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    );

  const [values, setValues] = useState<Record<string, string>>(buildInitial(initialItems));
  const [savedValues, setSavedValues] = useState<Record<string, string>>(buildInitial(initialItems));
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Accordion: all groups open by default
  const allGroups = [...new Set(initialItems.map((i) => i.group))];
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(allGroups));

  // Per-group "add new item" forms
  const [addingGroup, setAddingGroup] = useState<string | null>(null);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

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

  const handleSaveGroup = async (group: string, groupItems: SiteContentItem[]) => {
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
    if (!confirm(`Delete "${item.label}"?\n\nKey: ${item.key}\nThis cannot be undone.`)) return;
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
    // ensure section is open
    setOpenGroups((prev) => new Set([...prev, newItem.group]));
  };

  const totalChanges = allItems.filter(
    (item) => values[item.id] !== savedValues[item.id],
  ).length;

  return (
    <div className="space-y-4 pb-10">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {totalChanges > 0
            ? `${totalChanges} unsaved change${totalChanges === 1 ? "" : "s"}`
            : "All changes saved"}
        </p>
        <AdminButton
          type="button"
          onClick={handleSaveAll}
          disabled={savingAll || totalChanges === 0}
        >
          {savingAll ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </span>
          ) : (
            `Save All${totalChanges > 0 ? ` (${totalChanges})` : ""}`
          )}
        </AdminButton>
      </div>

      {/* Section accordion cards � hero & home-page first */}
      {Object.entries(grouped)
        .sort(([a], [b]) => {
          const ORDER = [
            "hero",
            "video-section",
            "home-page",
            "feature-cards",
            "about-images",
            "about-page",
            "about-features",
            "social-links",
            "newsletter",
            "shipping",
            "delivery-estimates",
            "announcement-marquee",
            "product-marquee",
            "partner-logos-marquee",
          ];
          const ai = ORDER.indexOf(a);
          const bi = ORDER.indexOf(b);
          if (ai === -1 && bi === -1) return a.localeCompare(b);
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        })
        .map(([group, groupItems]) => {
        const config = getGroupConfig(group);
        const isOpen = openGroups.has(group);
        const sectionChanges = groupItems.filter(
          (item) => values[item.id] !== savedValues[item.id],
        ).length;

        return (
          <div
            key={group}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Accordion header � click to open/close */}
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/80 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500">
                  {config.icon}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {config.label}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {groupItems.length} item{groupItems.length !== 1 ? "s" : ""}
                  </span>
                  {sectionChanges > 0 && (
                    <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {sectionChanges} unsaved
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {config.description && isOpen && (
                  <p className="hidden sm:block text-xs text-gray-400 max-w-xs text-right">
                    {config.description}
                  </p>
                )}
                {isOpen ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </div>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="border-t border-gray-100">
                <div className="p-5 space-y-5">
                  {groupItems.map((item) => {
                    const isActive = item.key.endsWith("_active");
                    const isColor = item.key.endsWith("_color");
                    const isMedia = isMediaKey(item.key);
                    const isLong =
                      !isMedia && (values[item.id] ?? "").length > 80;
                    const hasChange =
                      values[item.id] !== savedValues[item.id];

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-4 transition-colors ${
                          hasChange
                            ? "border-amber-200 bg-amber-50/30"
                            : "border-gray-100 bg-white"
                        }`}
                      >
                        {/* Item header */}
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={item.key}
                              className="block text-sm font-medium text-gray-800 cursor-pointer"
                            >
                              {item.label}
                            </label>
                            <span className="text-xs text-gray-400 font-mono">
                              {item.key}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {hasChange && (
                              <span className="text-xs text-amber-600 font-semibold">
                                unsaved
                              </span>
                            )}
                            <button
                              type="button"
                              title={`Delete "${item.label}"`}
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              {deletingId === item.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Field */}
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
                        ) : isMedia ? (
                          <MediaUploadField
                            id={item.key}
                            itemKey={item.key}
                            value={values[item.id] ?? ""}
                            onChange={(v) => handleChange(item.id, v)}
                          />
                        ) : isLong ? (
                          <textarea
                            id={item.key}
                            className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[72px] resize-y"
                            value={values[item.id] ?? ""}
                            onChange={(e) => handleChange(item.id, e.target.value)}
                          />
                        ) : (
                          <AdminInput
                            id={item.key}
                            value={values[item.id] ?? ""}
                            onChange={(e) => handleChange(item.id, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Add item form or button */}
                  {addingGroup === group ? (
                    <AddItemForm
                      group={group}
                      onCreated={handleItemCreated}
                      onCancel={() => setAddingGroup(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingGroup(group)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50/60 transition-colors"
                    >
                      <Plus size={14} /> Add item to this section
                    </button>
                  )}
                </div>

                {/* Section footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={sectionChanges === 0 || savingGroup === group}
                    onClick={() => handleSaveGroup(group, groupItems)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sectionChanges > 0
                        ? "bg-gray-900 text-white hover:bg-gray-700 cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-default"
                    }`}
                  >
                    {savingGroup === group ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        Saving…
                      </span>
                    ) : sectionChanges > 0 ? (
                      `Save Section (${sectionChanges})`
                    ) : (
                      "Saved ✓"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
