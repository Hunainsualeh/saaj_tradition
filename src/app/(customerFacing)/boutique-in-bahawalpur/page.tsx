import Link from "next/link";
import type { Metadata } from "next";

import {
  AnimatedHeadingText,
  BaseSection,
  BreadCrumb,
  ExploreLinks,
  FaqSection,
} from "@/components";
import { ProductShowcase } from "@/components/common/ProductShowcase/ProductShowcase";
import { JsonLd } from "@/components/seo/JsonLd";
import { routes } from "@/lib";
import {
  STORE_ADDRESS_TEXT,
  STORE_HOURS,
  STORE_PHONE,
  STORE_PHONE_DISPLAY,
} from "@/lib/constants/store-information";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Ladies Boutique for Bahawalpur | Suits Delivered with COD",
  absoluteTitle: true,
  description:
    "Order Bahawalpuri suits, lawn and Eid dresses online from Saaj Tradition with cash on delivery in Bahawalpur, or visit our boutique in Ahmedpur East.",
  path: routes.bahawalpurBoutique,
});

const faqs = [
  {
    question: "Do you have a shop in Bahawalpur city?",
    answer:
      "Our boutique is in Ahmedpur East, District Bahawalpur, on KLP Road near Hotel Pearl Resort, around 53 km (about 45 minutes by road) from Bahawalpur city. Customers in Bahawalpur can order online for home delivery or visit the Ahmedpur East store.",
  },
  {
    question: "Is cash on delivery available in Bahawalpur?",
    answer:
      "Yes. Cash on delivery is available in Bahawalpur and other eligible areas of Pakistan. You pay the courier when your order arrives. Online card payment is also available at checkout.",
  },
  {
    question: "How long does delivery to Bahawalpur take?",
    answer:
      "Orders are processed within 1 to 2 business days and usually arrive within 3 to 7 business days after dispatch, depending on the courier. You can follow your order on the Track Order page.",
  },
  {
    question: "Can I return or exchange a suit delivered in Bahawalpur?",
    answer:
      "Yes. You can request a return or exchange within 7 days of delivery if the item is unused, in its original condition and with tags attached. See the return policy for details.",
  },
  {
    question: "Which nearby areas do you deliver to?",
    answer:
      "We deliver across Pakistan, including Bahawalpur, Ahmedpur East, Uch Sharif, Dera Nawab Sahib, Yazman, Lodhran, Hasilpur, Khairpur Tamewali, Liaquatpur, Rahim Yar Khan and Multan.",
  },
];

export default function BahawalpurBoutiquePage() {
  const crumbs = [{ name: "Ladies Boutique for Bahawalpur" }];
  const telHref = `tel:${STORE_PHONE}`;

  return (
    <main>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <BaseSection id="bahawalpur-intro" className="pt-6 md:pt-10 pb-10 xl:pb-14">
        <div className="flex flex-col gap-4 max-w-4xl">
          <BreadCrumb items={[{ label: "Home", href: routes.home }, { label: crumbs[0].name }]} />
          <AnimatedHeadingText
            disableIsInView
            text="Ladies Suits Delivered in Bahawalpur"
            variant="page-title"
            className="pb-1"
          />
          <p className="text-base md:text-lg text-neutral-10">
            Saaj Tradition is a women&apos;s boutique from Ahmedpur East in
            District Bahawalpur. Shoppers in Bahawalpur city can order our
            traditional Bahawalpuri suits, embroidered lawn, cotton and Eid
            dresses online and pay cash on delivery, or make the short trip to
            our store on KLP Road.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={routes.shop}
              className="rounded-full bg-neutral-11 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-12"
            >
              Shop online
            </Link>
            <a
              href={telHref}
              className="rounded-full border border-neutral-05 px-6 py-3 text-sm font-medium text-neutral-11 hover:border-neutral-11"
            >
              Call {STORE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </BaseSection>

      <BaseSection id="bahawalpur-products" className="pb-16 xl:pb-20">
        <ProductShowcase
          heading="Popular with customers in Bahawalpur"
          intro="Ready to order with cash on delivery to your door in Bahawalpur."
        />
      </BaseSection>

      <BaseSection id="bahawalpur-how" className="py-16 xl:py-20 border-t border-neutral-03">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-10 xl:gap-16">
          <h2 className="text-3xl md:text-4xl font-medium">
            How ordering from Bahawalpur works
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base text-neutral-10">
            <li className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">1. Choose your suit</h3>
              <p>
                Browse the <Link href={routes.shop} className="underline underline-offset-2 hover:text-neutral-12">online shop</Link> or
                our <Link href={routes.bahawalpuriSuits} className="underline underline-offset-2 hover:text-neutral-12">traditional Bahawalpuri suits</Link> and
                select your size.
              </p>
            </li>
            <li className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">2. Pay your way</h3>
              <p>
                Pick cash on delivery or pay online by card at checkout. You
                receive an order confirmation by email.
              </p>
            </li>
            <li className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">3. Delivered to your door</h3>
              <p>
                We dispatch within 1 to 2 business days and our courier
                partners deliver across Bahawalpur, usually within 3 to 7
                business days.
              </p>
            </li>
            <li className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">4. Easy returns</h3>
              <p>
                Not quite right? Request a return or exchange within 7 days.
                Read the <Link href={routes.returnPolicy} className="underline underline-offset-2 hover:text-neutral-12">return policy</Link>.
              </p>
            </li>
          </ol>
        </div>
      </BaseSection>

      <BaseSection id="bahawalpur-visit" className="py-16 xl:py-20 border-t border-neutral-03">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-10 xl:gap-16">
          <h2 className="text-3xl md:text-4xl font-medium">
            Prefer to shop in person?
          </h2>
          <div className="flex flex-col gap-4 text-base text-neutral-10">
            <p>
              Our boutique is about 45 minutes from Bahawalpur city by road.
              See fabrics and colours in person, try sizes and get styling help
              from our team.
            </p>
            <address className="not-italic text-neutral-11">
              {STORE_ADDRESS_TEXT}
              <br />
              {STORE_HOURS.daysLabel}, {STORE_HOURS.timeLabel} ({STORE_HOURS.note})
            </address>
            <p>
              <Link href={routes.location} className="underline underline-offset-2 hover:text-neutral-12">
                Get directions to our Ahmedpur East boutique
              </Link>
            </p>
          </div>
        </div>
      </BaseSection>

      <BaseSection id="bahawalpur-links" className="py-16 xl:py-20 border-t border-neutral-03">
        <ExploreLinks
          heading="Popular with Bahawalpur shoppers"
          links={[
            { label: "Traditional Bahawalpuri Suits", href: routes.bahawalpuriSuits, description: "Chunri, gota and mukesh styles" },
            { label: "New Arrivals", href: routes.shopNewArrivals, description: "The latest ladies suits and dresses" },
            { label: "Collections", href: routes.shopCollections, description: "Eid, summer and festive edits" },
            { label: "Shipping Policy", href: routes.shippingPolicy, description: "Delivery times and charges" },
            { label: "Track Your Order", href: routes.track, description: "Check your delivery status" },
            { label: "Help & FAQ", href: routes.support, description: "Sizing, payments and returns" },
          ]}
        />
      </BaseSection>

      <BaseSection id="bahawalpur-faq" className="py-16 xl:py-20 border-t border-neutral-03">
        <div className="max-w-4xl">
          <FaqSection heading="Shopping from Bahawalpur: common questions" items={faqs} />
        </div>
      </BaseSection>
    </main>
  );
}
