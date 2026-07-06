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
  // Track the horizontal start point of a touch so we can detect a swipe on
  // mobile (where the hover-only arrows are not reachable).
  const touchStartX = useRef<number | null>(null);

  const scrollToThumb = useCallback((index: number) => {
    if (!thumbContainerRef.current) return;
    const thumbs = thumbContainerRef.current.children;
    if (thumbs[index]) {
      (thumbs[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, []);

  // === DERIVED VALUES (computed before handlers to avoid TDZ issues) ===

  // Keep original indices so onError always references the correct image in `images`
  const validImageEntries = images
    .map((img, i) => ({ img, i }))
    .filter(({ i }) => !failedIndexes.has(i));

  const effectiveIndex = Math.min(activeIndex, validImageEntries.length - 1);
  const activeEntry = validImageEntries[effectiveIndex];
  const activeImage = activeEntry?.img ?? "";
  const activeOriginalIndex = activeEntry?.i ?? 0;
  const hasMultiple = validImageEntries.length > 1;

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    // Ignore taps / tiny drags; only react to a deliberate horizontal swipe.
    if (Math.abs(delta) < 40 || !hasMultiple) return;
    if (delta < 0) handleNext();
    else handlePrev();
  };

  const handleImageError = (originalIndex: number) => {
    // Guard: if already failed, do nothing to avoid infinite re-renders
    if (failedIndexes.has(originalIndex)) return;
    setFailedIndexes((prev) => new Set(prev).add(originalIndex));
  };

  const placeholderIcon = (
    <svg
      className="w-14 h-14 text-neutral-300"
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
  );

  if (images.length === 0 || validImageEntries.length === 0) {
    return (
      <div className="w-full">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-xl bg-neutral-100 flex items-center justify-center">
          {placeholderIcon}
        </div>
      </div>
    );
  }

  return (
    // Vertical thumbnail rail beside the image on desktop, horizontal strip
    // below it on mobile. The whole gallery is width-capped so it stays
    // compact and elegant instead of ballooning on wide screens.
    <div className="mx-auto flex w-full max-w-[520px] flex-col-reverse gap-3 sm:max-w-none sm:flex-row sm:gap-3.5 lg:mx-0">
      {/* Thumbnail rail */}
      {hasMultiple && (
        <div
          ref={thumbContainerRef}
          className="flex shrink-0 gap-2.5 overflow-x-auto scrollbar-hide sm:max-h-[560px] sm:w-16 sm:flex-col sm:overflow-y-auto"
        >
          {validImageEntries.map(({ img, i }, index) => (
            <button
              key={i}
              onClick={() => handleThumbClick(index)}
              className={`relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg transition-all duration-200 sm:w-full ${
                index === effectiveIndex
                  ? "ring-2 ring-neutral-900 ring-offset-1 opacity-100"
                  : "opacity-60 hover:opacity-100 ring-1 ring-neutral-200"
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={index === effectiveIndex}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                onError={() => handleImageError(i)}
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image — fixed aspect-ratio box with object-cover: every photo
          fills the frame edge-to-edge, so the box never changes size when
          switching images and there is never any empty/blank space on the
          sides, whatever the photo's orientation. Height is capped so the
          gallery stays a comfortable size on large screens. */}
      <div
        className="group relative aspect-[4/5] max-h-[70vh] w-full min-w-0 flex-1 overflow-hidden rounded-xl bg-neutral-100 sm:max-h-[560px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          // key forces a fresh element per image so the browser never shows a
          // stale frame while the next photo decodes.
          key={activeOriginalIndex}
          src={activeImage}
          alt={`${productName} - Image ${effectiveIndex + 1}`}
          fill
          priority
          // No explicit quality → Cloudinary q_auto (adaptive, much smaller than
          // a fixed q_85, visually equivalent for photos). Keeps the gallery
          // fast to load, especially on mobile data.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 38vw"
          className="object-cover object-center"
          onError={() => handleImageError(activeOriginalIndex)}
        />

        {/* Navigation Arrows — always visible on touch devices (which have no
            hover), fading in on hover for pointer devices. */}
        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-105 cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-105 cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators (mobile only — thumbnails serve desktop) */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
            {validImageEntries.map(({ i }, index) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === effectiveIndex
                    ? "w-4 bg-neutral-900"
                    : "w-1.5 bg-neutral-900/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
