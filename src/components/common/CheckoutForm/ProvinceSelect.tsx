"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib";

// The five provinces of Pakistan.
export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Kashmir",
] as const;

type ProvinceSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isError?: boolean;
  placeholder?: string;
};

export function ProvinceSelect({
  id,
  value,
  onChange,
  onBlur,
  isError,
  placeholder = "Select province",
}: ProvinceSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onBlur]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger — mirrors the light Input look (pill, neutral-01 bg) */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "w-full px-6 py-3 inline-flex items-center justify-between gap-2 text-start rounded-4xl",
          "border border-1 bg-neutral-01 cursor-pointer transition-colors focus:outline-none",
          isError
            ? "border-red-500"
            : open
              ? "border-blue-400"
              : "border-transparent hover:border-neutral-05",
        )}
      >
        <span className={cn("truncate", value ? "text-black" : "text-neutral-08")}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 text-neutral-09 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Province"
          className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-neutral-04 bg-white p-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] animate-in fade-in-0 slide-in-from-top-1 duration-150"
        >
          {PAKISTAN_PROVINCES.map((province) => {
            const selected = value === province;
            return (
              <li key={province}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(province);
                    setOpen(false);
                    onBlur?.();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm rounded-xl text-left cursor-pointer transition-colors",
                    selected
                      ? "bg-neutral-02 text-black font-medium"
                      : "text-neutral-11 hover:bg-neutral-02",
                  )}
                >
                  {province}
                  {selected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
