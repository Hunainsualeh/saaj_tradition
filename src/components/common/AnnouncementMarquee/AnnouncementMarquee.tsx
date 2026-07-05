"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type AnnouncementMarqueeProps = {
  isActive: boolean;
  bgColor: string;
  textColor: string;
  separatorColor: string;
  texts: string[];
};

// Scroll speed in pixels per second — keeps the marquee feeling consistent
// regardless of how much text gets repeated to fill the bar.
const SCROLL_PX_PER_SECOND = 60;

export function AnnouncementMarquee({
  isActive,
  bgColor,
  textColor,
  separatorColor,
  texts,
}: AnnouncementMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(1);
  const [duration, setDuration] = useState(20);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    const segment = segmentRef.current;
    if (!container || !segment) return;

    const segmentWidth = segment.offsetWidth;
    if (segmentWidth === 0) return;

    // Repeat the text segment until one copy of the track overflows the bar, so
    // the scroll fills the full width with no empty gap. +1 keeps it covered as
    // the track shifts. This copy is then duplicated below for a seamless loop.
    const nextCopies = Math.max(1, Math.ceil(container.offsetWidth / segmentWidth) + 1);
    setCopies(nextCopies);
    setDuration((segmentWidth * nextCopies) / SCROLL_PX_PER_SECOND);
  }, []);

  useEffect(() => {
    if (!isActive || texts.length === 0) return;
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [isActive, texts, recalc]);

  if (!isActive || texts.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="overflow-hidden py-2.5 relative border-b cursor-default w-full"
      style={{
        backgroundColor: bgColor,
        borderColor: separatorColor,
      }}
    >
      <div
        key={copies}
        className="animate-marquee flex items-center"
        style={{ animationDuration: `${duration}s` }}
      >
        {/* Two identical halves make the full track; the animation shifts by
            exactly one half (-50%) so the loop is seamless. Each half is
            `copies` segments wide so the bar is always filled. The first
            segment carries `segmentRef` so we can measure one segment's width. */}
        {(["a", "b"] as const).map((halfKey) => (
          <div key={halfKey} className="flex items-center shrink-0">
            {Array.from({ length: copies }).map((_, i) => (
              <div
                key={`${halfKey}-${i}`}
                ref={halfKey === "a" && i === 0 ? segmentRef : undefined}
                className="flex items-center shrink-0"
              >
                {texts.map((text, j) => (
                  <React.Fragment key={j}>
                    <span
                      className="text-xs sm:text-sm tracking-[0.18em] uppercase whitespace-nowrap mx-5 sm:mx-8 font-medium"
                      style={{ color: textColor }}
                    >
                      {text}
                    </span>
                    <span
                      className="text-xs mx-4 sm:mx-6 select-none"
                      style={{ color: separatorColor }}
                      aria-hidden
                    >
                      ✦
                    </span>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
