import Image from "next/image";
import type { Metadata } from "next";

import {
  AnimatedHeadingText,
  AnimateFadeIn,
  BaseSection,
  FeatureCard,
  NewsletterCard,
  SectionHeading,
  TeamMemberCard,
} from "@/components";

import {
  STORE_EMAIL,
  STORE_INSTAGRAM,
  STORE_FACEBOOK,
} from "@/lib/constants/store-information";
import {
  getTeamMembers,
  getSiteContentMap,
} from "@/lib/server/queries";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const teamResponse = await getTeamMembers();
  const teamMembers = teamResponse.success ? teamResponse.data : [];

  const contentMapResponse = await getSiteContentMap();
  const c = contentMapResponse.success ? contentMapResponse.data : {};

  const email = c.social_email || STORE_EMAIL;
  const instagram = c.social_instagram || STORE_INSTAGRAM;
  const facebook = c.social_facebook || STORE_FACEBOOK;

  // About page images - controllable from admin Site Content
  const aboutImages = [
    c.about_image_1 || "/assets/about-us-image-1.jpg",
    c.about_image_2 || "/assets/about-us-image-2.jpg",
    c.about_image_3 || "/assets/about-us-image-3.jpg",
    c.about_image_4 || "/assets/about-us-image-4.jpg",
  ].filter(Boolean);
  const aboutFactImage = c.about_fact_image || "/assets/about-us-fact-image.jpg";

  const featureCards = [
    {
      number: "01",
      title: c.about_feature_1_title || "Premium Quality",
      description:
        c.about_feature_1_description ||
        "We source only the finest materials to ensure every piece meets our high standards of excellence.",
    },
    {
      number: "02",
      title: c.about_feature_2_title || "Sustainable Fashion",
      description:
        c.about_feature_2_description ||
        "Committed to eco-friendly practices and ethical production methods that protect our planet.",
    },
    {
      number: "03",
      title: c.about_feature_3_title || "Expert Craftsmanship",
      description:
        c.about_feature_3_description ||
        "Each item is carefully crafted by skilled artisans with decades of combined experience.",
    },
    {
      number: "04",
      title: c.about_feature_4_title || "Customer First",
      description:
        c.about_feature_4_description ||
        "Your satisfaction is our priority with dedicated support and hassle-free returns.",
    },
  ];

  return (
    <main>
      <BaseSection
        id="about-section-heading"
        className="flex flex-col pb-5 md:pb-10 xl:pb-20 gap-8 xl:gap-16"
      >
        <div className="flex flex-col gap-1 pt-6 md:pt-10 pb-6">
          <AnimatedHeadingText
            disableIsInView
            text="About Us"
            variant="page-title"
            className="pb-1"
          />
          <p className="text-neutral-10 text-base">
            {c.about_subtitle ||
              "Get to know who we are, what we stand for, and why we love what we do."}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <a
              href={`mailto:${email}`}
              aria-label="Email us"
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Instagram"
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Facebook"
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="w-full z-10 relative overflow-hidden">
          <div className="flex gap-4 animate-scroll-left-slow">
            {/* First set of images */}
            {aboutImages.map((src, index) => (
              <div
                className="relative w-62.5 aspect-3/4 lg:w-87.5 lg:aspect-6/7 shrink-0"
                key={`first-${index}`}
              >
                <Image
                  priority
                  className="object-cover rounded-sm"
                  src={src}
                  alt={`About us image ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 350px, 250px"
                />
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {aboutImages.map((src, index) => (
              <div
                className="relative w-62.5 aspect-3/4 lg:w-87.5 lg:aspect-6/7 shrink-0"
                key={`second-${index}`}
              >
                <Image
                  className="object-cover rounded-sm"
                  src={src}
                  alt={`About us image ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 350px, 250px"
                />
              </div>
            ))}
          </div>
        </div>
      </BaseSection>

      <BaseSection id="about-us-section-facts" className="py-16 xl:py-20">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] md:gap-12 xl:items-start">
          <div className="relative aspect-video xl:aspect-auto xl:h-full">
            <Image
              className="object-cover rounded-sm"
              src={aboutFactImage}
              priority
              alt={"About us image facts"}
              fill
              sizes="(min-width: 1280px) 33vw, 100vw"
            />
          </div>
          <div className="grid xl:col-span-1 grid-cols-1 md:grid-cols-2 xl:grid-rows-2 xl:auto-rows-min gap-y-10 gap-x-6 md:border-y py-10">
            {featureCards.map((card) => (
              <AnimateFadeIn key={card.number}>
                <FeatureCard
                  number={card.number}
                  title={card.title}
                  description={card.description}
                />
              </AnimateFadeIn>
            ))}
          </div>
        </div>
      </BaseSection>

      <BaseSection
        id="about-us-section-team"
        className="py-16 xl:py-20 gap-8 flex flex-col"
      >
        <SectionHeading
          heading={c.about_team_heading || "Meet Our Team"}
          subheading={c.about_team_subheading || "The superheroes"}
        />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {teamMembers.map((member, index) => (
            <AnimateFadeIn delay={index * 0.15} key={member.name}>
              <TeamMemberCard
                imageSrc={member.imageSrc}
                name={member.name}
                position={member.position}
              />
            </AnimateFadeIn>
          ))}
        </div>
      </BaseSection>

      <div className="relative bg-main-01">
        <BaseSection id="support-newsletter-section" className="py-16 xl:py-20">
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
