"use client";

import { useEffect, useMemo } from "react";

import { cn } from "@/lib";

const LS_KEY = "saaj_home_video";

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
    posterProp || cached?.poster || "/assets/video-home-poster.png";

  // Persist to localStorage whenever the resolved values change
  useEffect(() => {
    writeCache({ mp4: videoMp4, webm: videoWebm, poster, text });
  }, [videoMp4, videoWebm, poster, text]);

  return (
    <>
      <video
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
      >
        {videoWebm && <source src={videoWebm} type="video/webm" />}
        {videoMp4 && <source src={videoMp4} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
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
