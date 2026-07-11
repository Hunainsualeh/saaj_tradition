"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";

import { cn } from "@/lib";
import { useInViewOnce } from "@/lib/animations/use-in-view-once";

const LS_KEY = "saaj_home_video";

/**
 * Deliver Cloudinary videos with automatic quality (q_auto) — typically ~60%
 * smaller than the raw upload (measured: 6.5MB → 2.5MB) — while keeping each
 * source's container intact so the `<source type>` stays correct. Local
 * `/assets/*` fallbacks are returned untouched.
 */
function optimizeCloudinaryVideo(url: string): string {
  if (
    url.includes("res.cloudinary.com") &&
    url.includes("/video/upload/") &&
    !url.includes("/video/upload/q_auto")
  ) {
    return url.replace("/video/upload/", "/video/upload/q_auto/");
  }
  return url;
}

/**
 * Derive the `<source type>` from the file actually being served instead of
 * assuming the slot's container. The admin can (and currently does) save an
 * .mp4 URL into the "webm" slot; declaring `type="video/webm"` for it makes
 * the browser commit to a source based on a false capability check.
 */
function videoMime(url: string): string {
  return /\.webm(\?|#|$)/i.test(url) ? "video/webm" : "video/mp4";
}

type CachedVideo = {
  mp4: string;
  webm: string;
  poster: string;
  text: string;
};

function readCache(): CachedVideo | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedVideo;
  } catch {
    return null;
  }
}

function writeCache(data: CachedVideo) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded — ignore
  }
}

type HomeVideoSectionProps = {
  text?: string;
  videoMp4?: string;
  videoWebm?: string;
  poster?: string;
};

export function HomeVideoSection({
  text: textProp,
  videoMp4: mp4Prop,
  videoWebm: webmProp,
  poster: posterProp,
}: HomeVideoSectionProps) {
  // Defaults from DB props → localStorage cache → hardcoded fallback
  const cached = useMemo(() => readCache(), []);

  const text =
    textProp ||
    cached?.text ||
    "Discover a brand where style, quality, and craftsmanship come together.";
  const videoMp4 = mp4Prop || cached?.mp4 || "/assets/video-home-com.mp4";
  const videoWebm = webmProp || cached?.webm || "/assets/video-home.webm";
  const poster =
    posterProp || cached?.poster || "/assets/video-home-poster.jpg";

  // Persist to localStorage whenever the resolved values change
  useEffect(() => {
    writeCache({ mp4: videoMp4, webm: videoWebm, poster, text });
  }, [videoMp4, videoWebm, poster, text]);

  // Only download/mount the (large) video once the section approaches the
  // viewport. Until then the optimized poster stands in, so the tens of MB of
  // video never touch initial page load for visitors who don't scroll this far.
  const { ref, inView } = useInViewOnce("300px");

  // Apply Cloudinary q_auto only for delivery (the localStorage cache keeps the
  // raw URLs above so this stays idempotent across reloads).
  const videoMp4Src = optimizeCloudinaryVideo(videoMp4);
  const videoWebmSrc = optimizeCloudinaryVideo(videoWebm);

  return (
    <>
      <div ref={ref} className="absolute inset-0 overflow-hidden rounded-sm">
        {/* Optimized poster (AVIF/WebP via next/image) — painted immediately and
            shown behind the video until its first frame decodes. */}
        <Image
          src={poster}
          alt=""
          fill
          priority={false}
          quality={60}
          sizes="100vw"
          className="object-cover"
        />
        {inView && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            {videoWebm && <source src={videoWebmSrc} type={videoMime(videoWebmSrc)} />}
            {videoMp4 && <source src={videoMp4Src} type={videoMime(videoMp4Src)} />}
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      <div
        className={cn(
          "absolute inset-0 rounded-sm",
          "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_15%,rgba(0,0,0,0.6)_100%)]",
          "sm:bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.6)_100%)]",
          "xl:bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.6)_100%)]",
        )}
      />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <h2 className="pb-16 px-4 sm:px-10 md:px-18 lg:px-30 xl:px-40 text-white text-center text-3xl sm:text-4xl md:text-5xl xl:text-6xl max-w-[1350px]">
          {text}
        </h2>
      </div>
    </>
  );
}
