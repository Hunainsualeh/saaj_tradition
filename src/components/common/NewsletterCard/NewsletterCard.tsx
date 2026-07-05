import Image from "next/image";

import { AnimateFadeIn } from "@/components/ui";

import { NewsletterSignupForm } from "./NewsletterSignupForm";

type NewsletterCardProps = {
  heading?: string;
  description?: string;
  imageSrc?: string;
};

export function NewsletterCard({
  heading = "Stay Ahead with Exclusive Deals!",
  description = "Be the first to know about special offers, new product drops, and insider updates. Join our newsletter and get exclusive perks delivered straight to your inbox!",
  imageSrc = "/assets/newsletter-image3.jpg",
}: NewsletterCardProps) {
  return (
    <div className="bg-white border rounded-sm p-6 md:p-8 xl:p-10 flex flex-col xl:flex-row gap-10 justify-between">
      <div className="flex flex-col gap-12 xl:gap-0 justify-between xl:justify-around order-2 xl:order-1 xl:w-1/2 xl:py-8">
        <h3 className="text-2xl lg:text-3xl xl:text-4xl">
          {heading}
        </h3>
        <p className="text-neutral-10 text-base font-medium gap-12 max-w-150">
          {description}
        </p>
        <NewsletterSignupForm />
      </div>
      <AnimateFadeIn className="relative xl:w-1/2 aspect-5/3 order-1 xl:order-2">
        <Image
          src={imageSrc}
          alt="Newsletter"
          fill
          className="object-cover rounded-sm"
          sizes="(max-width: 1280px) 50vw, 100vw"
        />
      </AnimateFadeIn>
    </div>
  );
}
