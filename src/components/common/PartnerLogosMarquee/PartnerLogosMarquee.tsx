"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

import type { PartnerLogo } from "@/lib/partner-logos";

type PartnerLogosMarqueeProps = {
  isActive: boolean;
  heading: string;
  logos: PartnerLogo[];
};

/**
 * A single marquee item. Renders the logo image (uploaded or remote) inside a
 * fixed container using `object-contain` so every logo keeps its aspect ratio,
 * scales down when large, and stays centred when small. Falls back to the
 * partner name — or an icon — when an image URL fails to load.
 */
function LogoItem({ logo }: { logo: PartnerLogo }) {
  // Track which src failed so a changed source is automatically "not broken".
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);
  const hasImage = !!logo.image && erroredSrc !== logo.image;
  const hasName = !!logo.name;

  return (
    <div className="mx-10 flex h-16 shrink-0 items-center justify-center sm:mx-14 sm:h-20 md:mx-16">
      {hasImage ? (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          {/* Fixed box → consistent sizing & alignment for every logo. */}
          <div className="flex h-11 w-28 items-center justify-center sm:h-14 sm:w-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.image}
              alt={logo.name || "Partner logo"}
              loading="lazy"
              onError={() => setErroredSrc(logo.image ?? null)}
              className="max-h-full max-w-full object-contain opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </div>
          {hasName && (
            <span className="select-none whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-neutral-400 sm:text-xs">
              {logo.name}
            </span>
          )}
        </div>
      ) : hasName ? (
        <span className="select-none whitespace-nowrap text-lg font-black tracking-widest text-neutral-400 sm:text-2xl md:text-3xl">
          {logo.name}
        </span>
      ) : (
        // Image-only entry whose URL broke and has no name → graceful fallback.
        <div className="flex h-11 w-28 items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-300 sm:h-14 sm:w-40">
          <ImageOff size={20} />
        </div>
      )}
    </div>
  );
}

export function PartnerLogosMarquee({
  isActive,
  heading,
  logos,
}: PartnerLogosMarqueeProps) {
  if (!isActive || logos.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-b border-neutral-200 bg-neutral-50 py-12 sm:py-16">
      {heading && (
        <p className="mb-8 px-4 text-center text-xs uppercase tracking-[0.4em] text-neutral-400 sm:mb-10">
          {heading}
        </p>
      )}
      {/* Forward-scroll at a slower speed for variety. */}
      <div
        className="animate-marquee flex items-center"
        style={{ animationDuration: "50s" }}
      >
        {/* Group 1 */}
        <div className="flex shrink-0 items-center">
          {logos.map((logo, i) => (
            <LogoItem key={`l1-${i}`} logo={logo} />
          ))}
        </div>
        {/* Group 2 — exact duplicate for a seamless loop. */}
        <div className="flex shrink-0 items-center" aria-hidden>
          {logos.map((logo, i) => (
            <LogoItem key={`l2-${i}`} logo={logo} />
          ))}
        </div>
      </div>
    </div>
  );
}
