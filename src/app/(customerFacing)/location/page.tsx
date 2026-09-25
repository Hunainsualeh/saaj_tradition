import Link from "next/link";
import type { Metadata } from "next";

import {
  AnimatedHeadingText,
  BaseSection,
  BreadCrumb,
  ExploreLinks,
  FaqSection,
  NewsletterCard,
} from "@/components";
import { JsonLd } from "@/components/seo/JsonLd";
import { routes } from "@/lib";
import { STORE_HOURS } from "@/lib/constants/store-information";
import { getSiteContentMap } from "@/lib/server/queries";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

import { LocationCard } from "./LocationCard";

export const metadata: Metadata = pageMetadata({
  title: "Ladies Boutique in Ahmedpur East | Store Address & Hours",
  absoluteTitle: true,
  description:
    "Visit Saaj Tradition, a ladies boutique on KLP Road near Hotel Pearl Resort, Ahmedpur East. Bahawalpuri suits, lawn and Eid dresses. Open Mon to Sat.",
  path: routes.location,
});

const nearbyAreas = [
  { name: "Dera Nawab Sahib", distance: "next to Ahmedpur East" },
  { name: "Uch Sharif", distance: "about 24 km" },
  { name: "Chani Goth", distance: "about 28 km" },
  { name: "Khanqah Sharif", distance: "about 38 km" },
  { name: "Liaquatpur", distance: "about 49 km" },
  { name: "Bahawalpur city", distance: "about 53 km" },
];

const faqs = [
  {
    question: "Where is Saaj Tradition in Ahmedpur East?",
    answer:
      "We are half a kilometre along KLP Road, near Hotel Pearl Resort, Ahmedpur East, District Bahawalpur, Punjab 63350. Use the Get Directions button on this page to open the route in Google Maps.",
  },
  {
    question: "What are the boutique opening hours?",
    answer: `We are open ${STORE_HOURS.daysLabel.replace("–", "to")}, ${STORE_HOURS.timeLabel.replace("–", "to")}. ${STORE_HOURS.note}. Hours can change around Eid, so call ahead during the festive season.`,
  },
  {
    question: "Can I see a suit in store before ordering online?",
    answer:
      "Yes. Visit the boutique to check fabric, colour and fit, or message us with the product name and we will confirm availability before you travel.",
  },
  {
    question: "Do you deliver outside Ahmedpur East?",
    answer:
      "Yes. We deliver across Pakistan, including Bahawalpur, Uch Sharif, Liaquatpur, Rahim Yar Khan and Multan, with cash on delivery in eligible areas.",
  },
];

export default async function LocationPage() {
  const contentMapResponse = await getSiteContentMap();
  const c = contentMapResponse.success ? contentMapResponse.data : {};
  const crumbs = [{ name: "Boutique in Ahmedpur East" }];

  return (
    <main>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <BaseSection id="location-section" className="pb-16 xl:pb-20">
        <div className="flex flex-col gap-3 pt-6 md:pt-10 pb-8 max-w-4xl">
          <BreadCrumb items={[{ label: "Home", href: routes.home }, { label: crumbs[0].name }]} />
          <AnimatedHeadingText
            disableIsInView
            text="Our Boutique in Ahmedpur East"
            variant="page-title"
            className="pb-1"
          />
          <p className="text-neutral-10 text-base md:text-lg">
            Visit Saaj Tradition on KLP Road in Ahmedpur East (Ahmadpur
            Sharqia), District Bahawalpur, to shop traditional Bahawalpuri
            suits, lawn and cotton suits and festive Eid dresses in person.
            We&apos;d love to see you, or get in touch any time.
          </p>
        </div>

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
      </BaseSection>

      <BaseSection id="location-details" className="py-16 xl:py-20 border-t border-neutral-03">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-16 text-base text-neutral-10">
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-medium text-neutral-12">
              Finding the store
            </h2>
            <p>
              Head out along KLP Road from Ahmedpur East. We are about half a
              kilometre along the road, near Hotel Pearl Resort. If you are
              coming from Bahawalpur the drive is roughly 45 minutes.
            </p>
            <p>
              Not sure you have the right place? Call us before you set off
              and we will guide you in.
            </p>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-medium text-neutral-12">
              What you&apos;ll find in store
            </h2>
            <p>
              Browse ladies suits across lawn, cotton, chiffon and embroidered
              styles, including our{" "}
              <Link href={routes.bahawalpuriSuits} className="underline underline-offset-2 hover:text-neutral-12">
                traditional Bahawalpuri suits
              </Link>{" "}
              and seasonal{" "}
              <Link href={routes.shopCollections} className="underline underline-offset-2 hover:text-neutral-12">
                Eid and summer collections
              </Link>
              . Everything in the boutique can also be ordered from the{" "}
              <Link href={routes.shop} className="underline underline-offset-2 hover:text-neutral-12">
                online shop
              </Link>
              .
            </p>
          </section>
          <section className="flex flex-col gap-3 xl:col-span-2">
            <h2 className="text-2xl md:text-3xl font-medium text-neutral-12">
              Shoppers from nearby towns
            </h2>
            <p>
              Customers visit us from across the Ahmedpur East area. Can&apos;t
              make the trip? We deliver to all of these towns with cash on
              delivery, and to{" "}
              <Link href={routes.bahawalpurBoutique} className="underline underline-offset-2 hover:text-neutral-12">
                Bahawalpur city
              </Link>
              .
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {nearbyAreas.map((area) => (
                <li key={area.name} className="rounded-sm border border-neutral-03 px-4 py-3">
                  <span className="font-medium text-neutral-12">{area.name}</span>
                  <span className="text-sm"> · {area.distance}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </BaseSection>

      <BaseSection id="location-faq" className="py-16 xl:py-20 border-t border-neutral-03">
        <div className="max-w-4xl">
          <FaqSection heading="Visiting the boutique: common questions" items={faqs} />
        </div>
      </BaseSection>

      <BaseSection id="location-links" className="pb-16 xl:pb-20">
        <ExploreLinks
          heading="Start shopping"
          links={[
            { label: "Shop all suits", href: routes.shop, description: "Browse the full online collection" },
            { label: "New Arrivals", href: routes.shopNewArrivals, description: "The latest pieces in store and online" },
            { label: "Help & FAQ", href: routes.support, description: "Orders, delivery and returns" },
          ]}
        />
      </BaseSection>

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
