"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Chip-based editor for newline-separated lists (announcement lines, partner
 * names, etc.). Each entry is rendered as a removable pill; Enter or comma adds
 * a new entry. Value is stored as a single "\n"-joined string so it is a drop-in
 * replacement for a multiline textarea.
 */
export function AdminTagListField({
  id,
  value,
  onChange,
  placeholder,
  hint = true,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  const tags = value
    .split("\n")
    .map((t) => t.trim())
    .filter((t) => t !== "");

  const commit = (next: string[]) => onChange(next.join("\n"));

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !tags.includes(trimmed)) commit([...tags, trimmed]);
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    commit(tags.filter((_, i) => i !== indexToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      e.preventDefault();
      commit(tags.slice(0, -1));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const newTags = pasted
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter((t) => t !== "" && !tags.includes(t));
    if (newTags.length > 0) commit([...tags, ...newTags]);
  };

  return (
    <div className="space-y-2">
      <div
        className="w-full flex flex-wrap content-start gap-2 p-3 min-h-[90px] bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-900/10 focus-within:border-gray-400 transition-all cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-gray-200/80 text-gray-700 text-sm rounded-full shadow-sm hover:shadow hover:border-gray-300 transition-all"
          >
            <span className="max-w-[200px] sm:max-w-md truncate">{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              aria-label={`Remove "${tag}"`}
              className="text-gray-400 hover:text-red-500 focus:outline-none focus:text-red-500 rounded-full hover:bg-red-50 p-1 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="flex-1 min-w-[180px] bg-transparent outline-none text-sm text-gray-800 py-1 px-1 placeholder-gray-400"
          placeholder={
            tags.length === 0
              ? (placeholder ?? "Type and press Enter...")
              : "Add another..."
          }
        />
      </div>
      {hint && (
        <p className="text-xs text-gray-400">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">
            Enter
          </kbd>{" "}
          or{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">
            ,
          </kbd>{" "}
          to add an entry.
        </p>
      )}
    </div>
  );
}
