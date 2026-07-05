import type { Metadata } from "next";

import {
  AnimatedHeadingText,
  AnimateFadeIn,
  BaseSection,
  NewsletterCard,
} from "@/components";
import { getSiteContentMap } from "@/lib/server/queries";

import { LocationCard } from "./LocationCard";

export const metadata: Metadata = {
  title: "Location",
};

export default async function LocationPage() {
  const contentMapResponse = await getSiteContentMap();
  const c = contentMapResponse.success ? contentMapResponse.data : {};

  return (
    <main>
      <BaseSection id="location-section" className="pb-16 xl:pb-20">
        <div className="flex flex-col gap-1 pt-6 md:pt-10 pb-8">
          <AnimatedHeadingText
            disableIsInView
            text="Our Location"
            variant="page-title"
            className="pb-1"
          />
          <p className="text-neutral-10 text-base">
            Visit us or get in touch — we&apos;d love to hear from you.
          </p>
        </div>

        <AnimateFadeIn className="w-full">
          <LocationCard
            storeName={c.location_store_name}
            address={c.location_address}
            hoursDays={c.location_hours_days}
            hoursTime={c.location_hours_time}
            hoursNote={c.location_hours_note}
            phone={c.social_phone}
            email={c.social_email}
            mapQuery={c.location_map_query}
          />
        </AnimateFadeIn>
      </BaseSection>

      {/* Newsletter */}
      <div className="relative bg-main-01">
        <BaseSection id="location-newsletter-section" className="py-16 xl:py-20">
          <NewsletterCard
            heading={c.newsletter_heading}
            description={c.newsletter_description}
            imageSrc={c.newsletter_image}
          />
        </BaseSection>
      </div>
    </main>
  );
}
