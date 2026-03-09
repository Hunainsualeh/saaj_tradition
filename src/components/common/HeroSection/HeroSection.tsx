"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { BaseSection } from "@/components/layout";
import { AnimateFadeIn } from "@/components/ui";
import { cn } from "@/lib";
import { HeroSectionButton } from "./HeroSectionButton";

const WAIT_FOR_IMAGE_TIMEOUT = 1800; // ms
const LS_KEY = "saaj_hero";

type CachedHero = { image: string; heading: string; subheading: string };

function readCache(): CachedHero | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedHero;
  } catch {
    return null;
  }
}

function writeCache(data: CachedHero) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded — ignore
  }
}

type HeroSectionProps = {
  heading?: string;
  subheading?: string;
  imageUrl?: string;
};

export function HeroSection({
  heading: headingProp,
  subheading: subheadingProp,
  imageUrl: imageUrlProp,
}: HeroSectionProps) {
  // DB props → localStorage cache → hardcoded fallback
  const cached = useMemo(() => readCache(), []);

  const heading = headingProp || cached?.heading || "Traditional Bahawalpuri Suits";
  const subheading = subheadingProp || cached?.subheading || "Experience tradition, woven into every thread.";
  const imageUrl = imageUrlProp || cached?.image || "/assets/hero-landing.jpg";

  // Persist to localStorage for faster subsequent loads
  useEffect(() => {
    writeCache({ image: imageUrl, heading, subheading });
  }, [imageUrl, heading, subheading]);
  // === STATE ===
  const [imageReady, setImageReady] = useState(false);

  // === EFFECT ===
  useEffect(() => {
    setTimeout(() => setImageReady(true), WAIT_FOR_IMAGE_TIMEOUT);
  }, []);

  return (
    <BaseSection
      id="hero-image"
      className="min-h-[calc(100dvh-74px)] md:min-h-[calc(100dvh-82px)] flex flex-col pb-5 md:pb-12"
    >
      <div className="h-[75dvh] w-full relative mt-auto">
        <Image
          src={imageUrl}
          alt="Hero Image"
          fill
          sizes="100vw"
          quality={75}
          priority
          className="object-cover rounded-sm"
          onLoad={() => setImageReady(true)}
        />
        <AnimateFadeIn
          noMargin
          delay={0.2}
          hidden={!imageReady}
          duration="long"
        >
          <div
            className={cn(
              "absolute inset-0 rounded-sm",
              "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_15%,rgba(0,0,0,0.6)_100%)]",
              "sm:bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.6)_100%)]",
              "xl:bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_70%,rgba(0,0,0,0.6)_100%)]",
            )}
          />
        </AnimateFadeIn>
        <AnimateFadeIn
          noMargin
          delay={0.2}
          hidden={!imageReady}
          duration="long"
        >
          <div className="absolute inset-0 flex flex-col xl:flex-row justify-end items-center xl:items-end px-6 py-10 md:p-10 xl:p-12 text-white">
            <HeroSectionButton className="order-2 xl:order-1 mt-6 xl:mt-0" />
            <div className="flex flex-col xl:text-end gap-4 xl:ms-auto order-1 xl:order-2">
              <h1 className={cn("text-[clamp(2.5rem,8vw,5rem)]!")}>
                {heading}
              </h1>
              <h5 className="text-white md:text-neutral-04 font-medium">
                {subheading}
              </h5>
            </div>
          </div>
        </AnimateFadeIn>
      </div>
    </BaseSection>
  );
}
