import Image from "next/image";

import { BaseSection } from "@/components/layout";
import { cn } from "@/lib";
import { HeroSectionButton } from "./HeroSectionButton";

type HeroSectionProps = {
  heading?: string;
  subheading?: string;
  imageUrl?: string;
};

/**
 * Server-rendered hero. The heading/subheading are painted immediately (they
 * are the LCP candidate) instead of being hidden behind a JS "image ready"
 * timer, and the dark placeholder background keeps the white text legible
 * before the image finishes loading. No client JS ships for this section.
 */
export function HeroSection({
  heading: headingProp,
  subheading: subheadingProp,
  imageUrl: imageUrlProp,
}: HeroSectionProps) {
  const heading = headingProp || "Traditional Bahawalpuri dresses";
  const subheading =
    subheadingProp || "Experience tradition, woven into every thread.";
  const imageUrl = imageUrlProp || "/assets/hero-landing.jpg";

  return (
    <BaseSection
      id="hero-image"
      className="min-h-[calc(100dvh-74px)] md:min-h-[calc(100dvh-82px)] flex flex-col pb-5 md:pb-12"
    >
      <div className="h-[75dvh] w-full relative mt-auto overflow-hidden rounded-sm bg-neutral-11">
        <Image
          src={imageUrl}
          alt="Hero Image"
          fill
          sizes="100vw"
          quality={75}
          priority
          className="object-cover"
        />

        {/* Gradient overlay for text contrast — rendered immediately. */}
        <div
          className={cn(
            "absolute inset-0",
            "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_15%,rgba(0,0,0,0.6)_100%)]",
            "sm:bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.6)_100%)]",
            "xl:bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_70%,rgba(0,0,0,0.6)_100%)]",
          )}
        />

        {/* Hero content — visible on first paint for a fast LCP. */}
        <div className="absolute inset-0 flex flex-col xl:flex-row justify-end items-center xl:items-end px-6 py-10 md:p-10 xl:p-12 text-white">
          <HeroSectionButton className="order-2 xl:order-1 mt-6 xl:mt-0" />
          <div className="flex flex-col xl:text-end gap-4 xl:ms-auto order-1 xl:order-2">
            <h1 className={cn("text-[clamp(2.5rem,8vw,5rem)]!")}>{heading}</h1>
            <h5 className="text-white md:text-neutral-04 font-medium">
              {subheading}
            </h5>
          </div>
        </div>
      </div>
    </BaseSection>
  );
}
