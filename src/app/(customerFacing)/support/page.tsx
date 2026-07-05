import Image from "next/image";
import type { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AnimatedHeadingText,
  AnimateFadeIn,
  AnimateStagger,
  BaseSection,
  ContactCard,
  NewsletterCard,
  HomeIcon,
  PhoneIcon,
  EmailIcon,
} from "@/components";

import { supportFaqQuestions } from "@/lib";
import { STORE_EMAIL, STORE_PHONE } from "@/lib/constants/store-information";
import { getSiteContentMap } from "@/lib/server/queries";

export const metadata: Metadata = {
  title: "Support",
};

function parseFaq(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("|");
      if (idx === -1) return null;
      const question = line.slice(0, idx).trim();
      const answer = line.slice(idx + 1).trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => item !== null);
}

export default async function SupportPage() {
  const contentMapResponse = await getSiteContentMap();
  const c = contentMapResponse.success ? contentMapResponse.data : {};

  const parsedFaq = parseFaq(c.support_faq);
  const faqQuestions = parsedFaq.length > 0 ? parsedFaq : supportFaqQuestions;

  const contactAddress =
    c.location_address || "47PF+R29, Ahmedpur East, Pakistan";
  const contactPhone = c.social_phone || STORE_PHONE;
  const contactEmail = c.social_email || STORE_EMAIL;

  const contactInfo = [
    {
      title: "Visit Us",
      description: contactAddress,
      icon: <HomeIcon />,
    },
    {
      title: "Call Us",
      description: contactPhone,
      href: `tel:${contactPhone.replace(/[^\d+]/g, "")}`,
      icon: <PhoneIcon />,
    },
    {
      title: "Email Us",
      description: contactEmail,
      href: `mailto:${contactEmail}`,
      icon: <EmailIcon />,
    },
  ];

  return (
    <main>
      <BaseSection id="support-section" className="pb-16 xl:pb-20">
        <div className="flex flex-col gap-1 pt-6 md:pt-10 pb-6">
          <AnimatedHeadingText
            disableIsInView
            text="We're Here to Help"
            variant="page-title"
            className="pb-1"
          />
          <p className="text-neutral-10 text-base">
            {
              "Questions? Concerns? Let’s make your shopping experience seamless and enjoyable."
            }
          </p>
        </div>
        <div className="flex flex-col gap-10 md:gap-0 md:flex-row justify-between pt-12 items-center">
          <AnimateFadeIn className="relative w-full md:w-1/3 min-h-100 max-h-125 h-full">
            <Image
              priority
              className="object-cover rounded-sm"
              src="/assets/support-hero.webp"
              alt="Support Image"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={60}
              fill
            />
          </AnimateFadeIn>
          <AnimateFadeIn className="w-full md:w-[57%]">
            <Accordion collapsible type="single">
              {faqQuestions.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimateFadeIn>
        </div>
      </BaseSection>

      <BaseSection
        id="contact-section"
        className="py-16 xl:py-20 flex flex-col gap-8"
      >
        <AnimatedHeadingText text="Contact" />
        <AnimateStagger
          className="flex justify-between flex-col xl:flex-row gap-6 w-full"
          childClassName="flex-1"
        >
          {contactInfo.map((contact, index) => (
            <ContactCard className="xl:w-full" key={index} {...contact} />
          ))}
        </AnimateStagger>
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
