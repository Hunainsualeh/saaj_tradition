"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());
  const thumbContainerRef = useRef<HTMLDivElement>(null);

  const scrollToThumb = useCallback(
    (index: number) => {
      if (!thumbContainerRef.current) return;
      const thumbs = thumbContainerRef.current.children;
      if (thumbs[index]) {
        (thumbs[index] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    },
    [],
  );

  // === DERIVED VALUES (computed before handlers to avoid TDZ issues) ===

  // Keep original indices so onError always references the correct image in `images`
  const validImageEntries = images
    .map((img, i) => ({ img, i }))
    .filter(({ i }) => !failedIndexes.has(i));

  const effectiveIndex = Math.min(activeIndex, validImageEntries.length - 1);
  const activeEntry = validImageEntries[effectiveIndex];
  const activeImage = activeEntry?.img ?? "";
  const activeOriginalIndex = activeEntry?.i ?? 0;

  // === HANDLERS ===

  const handleThumbClick = (index: number) => {
    setActiveIndex(index);
    scrollToThumb(index);
  };

  const handlePrev = () => {
    const count = validImageEntries.length;
    const next = effectiveIndex === 0 ? count - 1 : effectiveIndex - 1;
    setActiveIndex(next);
    scrollToThumb(next);
  };

  const handleNext = () => {
    const count = validImageEntries.length;
    const next = effectiveIndex === count - 1 ? 0 : effectiveIndex + 1;
    setActiveIndex(next);
    scrollToThumb(next);
  };

  const handleImageError = (originalIndex: number) => {
    // Guard: if already failed, do nothing to avoid infinite re-renders
    if (failedIndexes.has(originalIndex)) return;
    setFailedIndexes((prev) => new Set(prev).add(originalIndex));
  };

  if (images.length === 0 || validImageEntries.length === 0) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="relative aspect-[3/4] w-full max-h-[75vh] overflow-hidden rounded-sm bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Main Image */}
      <div className="relative aspect-[3/4] w-full max-h-[75vh] overflow-hidden rounded-sm bg-neutral-100 group">
        <Image
          src={activeImage}
          alt={`${productName} - Image ${effectiveIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 55vw"
          className="object-cover"
          onError={() => handleImageError(activeOriginalIndex)}
        />

        {/* Navigation Arrows */}
        {validImageEntries.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-sm cursor-pointer"
              aria-label="Previous image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-sm cursor-pointer"
              aria-label="Next image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter (mobile) */}
        {validImageEntries.length > 1 && (
          <span className="absolute bottom-2 right-2 sm:hidden bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
            {effectiveIndex + 1}/{validImageEntries.length}
          </span>
        )}
      </div>

      {/* Thumbnail Strip */}
      {validImageEntries.length > 1 && (
        <div
          ref={thumbContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        >
          {validImageEntries.map(({ img, i }, index) => (
            <button
              key={i}
              onClick={() => handleThumbClick(index)}
              className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden cursor-pointer transition-all duration-200 ${
                index === effectiveIndex
                  ? "ring-2 ring-black ring-offset-1 opacity-100"
                  : "opacity-50 hover:opacity-80"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={img}
                alt={`${productName} thumb ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
