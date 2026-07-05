"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ImageOff,
  Link2 as LinkIcon,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  type PartnerLogo,
  parsePartnerLogos,
  serializePartnerLogos,
} from "@/lib/partner-logos";

const ACCEPT_TYPES =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB — matches the upload route's image limit.

/** Preview thumbnail that falls back gracefully when an image URL is broken. */
function LogoThumb({ image, name }: { image?: string; name?: string }) {
  // Track which src failed (not just a boolean) so a new source is automatically
  // considered "not broken" — no reset effect needed when `image` changes.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);
  const showImage = !!image && erroredSrc !== image;

  return (
    <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name || "Partner logo"}
          onError={() => setErroredSrc(image ?? null)}
          className="max-h-full max-w-full object-contain p-1.5"
        />
      ) : image ? (
        <div className="flex flex-col items-center gap-0.5 text-amber-500">
          <ImageOff size={18} />
          <span className="text-[9px] font-medium">Broken</span>
        </div>
      ) : name ? (
        <span className="line-clamp-2 px-1 text-center text-[11px] font-bold uppercase tracking-wide text-gray-400">
          {name}
        </span>
      ) : (
        <span className="text-[10px] text-gray-300">No logo</span>
      )}
    </div>
  );
}

function PartnerEntryCard({
  entry,
  index,
  total,
  uploading,
  onChange,
  onUpload,
  onMove,
  onRemove,
}: {
  entry: PartnerLogo;
  index: number;
  total: number;
  uploading: boolean;
  onChange: (patch: Partial<PartnerLogo>) => void;
  onUpload: (file: File) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const isEmpty = !entry.name?.trim() && !entry.image?.trim();

  const setUrl = () => {
    const next = urlDraft.trim();
    if (!next) return;
    onChange({ image: next });
    setUrlDraft("");
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex gap-3">
        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
          {index + 1}
        </span>

        <LogoThumb image={entry.image} name={entry.name} />

        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={entry.name ?? ""}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Partner name (optional)"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />

          {/* Logo image: upload a file or paste an image URL. */}
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_TYPES}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UploadCloud size={13} />
              )}
              {uploading ? "Uploading…" : entry.image ? "Replace" : "Upload"}
            </button>

            <div className="flex min-w-[180px] flex-1 items-center gap-1.5">
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setUrl();
                  }
                }}
                placeholder="…or paste an image URL"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="button"
                disabled={!urlDraft.trim()}
                onClick={setUrl}
                aria-label="Use image URL"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                <LinkIcon size={13} />
              </button>
            </div>

            {entry.image && (
              <button
                type="button"
                onClick={() => onChange({ image: "" })}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-400 transition-colors hover:text-red-500"
              >
                <X size={13} /> Logo
              </button>
            )}
          </div>
        </div>

        {/* Reorder + delete */}
        <div className="flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move up"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronUp size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move down"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronDown size={15} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Delete partner"
            className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isEmpty && (
        <p className="pl-8 text-[11px] text-amber-600">
          Add a name or a logo — empty entries are discarded on save.
        </p>
      )}
    </div>
  );
}

/**
 * Rich editor for the partner-logos list. Each entry supports a partner name,
 * an uploaded logo, an external logo URL, or any combination. Serialises to the
 * shared `partners_logos` JSON format (see {@link serializePartnerLogos}).
 *
 * Entries are held in local state so an in-progress empty row stays visible —
 * `serializePartnerLogos` drops empty entries, so they cannot survive a round
 * trip through the controlled `value`.
 */
export function PartnerLogosField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [entries, setEntries] = useState<PartnerLogo[]>(() =>
    parsePartnerLogos(value),
  );
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Track the last value we emitted so we can re-sync from external resets
  // (e.g. the form's "Discard") without clobbering local empty rows.
  const lastEmitted = useRef(value);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    if (value !== lastEmitted.current) {
      const parsed = parsePartnerLogos(value);
      setEntries(parsed);
      entriesRef.current = parsed;
      lastEmitted.current = value;
    }
  }, [value]);

  const update = useCallback(
    (next: PartnerLogo[]) => {
      setEntries(next);
      entriesRef.current = next;
      const serialized = serializePartnerLogos(next);
      lastEmitted.current = serialized;
      onChange(serialized);
    },
    [onChange],
  );

  const patch = (index: number, p: Partial<PartnerLogo>) =>
    update(entriesRef.current.map((e, i) => (i === index ? { ...e, ...p } : e)));

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= entriesRef.current.length) return;
    const next = [...entriesRef.current];
    [next[index], next[j]] = [next[j], next[index]];
    update(next);
  };

  const remove = (index: number) =>
    update(entriesRef.current.filter((_, i) => i !== index));

  const add = () => update([...entriesRef.current, { name: "" }]);

  const uploadFor = useCallback(
    async (index: number, file: File) => {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error("File too large — max 50 MB");
        return;
      }
      setUploadingIndex(index);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/site-content/upload", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        // entriesRef reflects the latest list even if other rows changed mid-upload.
        update(
          entriesRef.current.map((e, i) =>
            i === index ? { ...e, image: json.url } : e,
          ),
        );
        toast.success("Logo uploaded");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingIndex(null);
      }
    },
    [update],
  );

  return (
    <div className="space-y-2.5">
      {entries.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3 py-4 text-center text-xs text-gray-400">
          No partners yet. Add a name, a logo, or both.
        </p>
      )}

      {entries.map((entry, index) => (
        <PartnerEntryCard
          key={index}
          entry={entry}
          index={index}
          total={entries.length}
          uploading={uploadingIndex === index}
          onChange={(p) => patch(index, p)}
          onUpload={(file) => uploadFor(index, file)}
          onMove={(dir) => move(index, dir)}
          onRemove={() => remove(index)}
        />
      ))}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50/50 hover:text-gray-700"
      >
        <Plus size={14} /> Add partner
      </button>
    </div>
  );
}
