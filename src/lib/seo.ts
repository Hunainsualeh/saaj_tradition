import type { Metadata } from "next";

import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import {
  STORE_ADDRESS,
  STORE_EMAIL,
  STORE_FACEBOOK,
  STORE_GEO,
  STORE_HOURS,
  STORE_INSTAGRAM,
  STORE_MAP_QUERY,
  STORE_NAME,
  STORE_PHONE,
} from "@/lib/constants/store-information";

export const SITE_NAME = STORE_NAME;
export const SITE_URL = PRODUCTION_SITE_URL;
export const DEFAULT_OG_IMAGE = "/assets/og-image.jpg";
export const LOGO_PATH = "/assets/logo/Saaj%20Tradition%20Golden.png";

export const DEFAULT_TITLE =
  "Saaj Tradition | Bahawalpuri Suits & Ladies Boutique in Ahmedpur East";
export const DEFAULT_DESCRIPTION =
  "Traditional Bahawalpuri suits, embroidered lawn and Eid dresses from Saaj Tradition, a ladies boutique in Ahmedpur East, Bahawalpur. Cash on delivery.";

export const STORE_ID = `${SITE_URL}/#store`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? SITE_URL : `${SITE_URL}${clean}`;
}

export function clampDescription(text: string | null | undefined, max = 158): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  images?: { url: string; alt?: string; width?: number; height?: number }[];
  noindex?: boolean;
  follow?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  images,
  noindex = false,
  follow = true,
  type = "website",
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const ogImages =
    images && images.length > 0
      ? images
      : [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} boutique` }];
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: noindex
      ? { index: false, follow, googleBot: { index: false, follow } }
      : undefined,
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_PK",
      type,
      images: ogImages,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export function breadcrumbJsonLd(items: { name: string; path?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function storeJsonLd() {
  return {
    "@type": "ClothingStore",
    "@id": STORE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(LOGO_PATH),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      "Ladies boutique in Ahmedpur East, District Bahawalpur, selling traditional Bahawalpuri suits, embroidered lawn, Eid and formal dresses in store and online with delivery across Pakistan.",
    email: STORE_EMAIL,
    telephone: STORE_PHONE,
    priceRange: "Rs",
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash on Delivery, Debit Card, Credit Card, Bank Transfer",
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE_ADDRESS.streetAddress,
      addressLocality: STORE_ADDRESS.addressLocality,
      addressRegion: STORE_ADDRESS.addressRegion,
      postalCode: STORE_ADDRESS.postalCode,
      addressCountry: STORE_ADDRESS.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: STORE_GEO.latitude,
      longitude: STORE_GEO.longitude,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAP_QUERY)}`,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: STORE_HOURS.days,
        opens: STORE_HOURS.opens,
        closes: STORE_HOURS.closes,
      },
    ],
    areaServed: [
      { "@type": "City", name: "Ahmedpur East" },
      { "@type": "City", name: "Bahawalpur" },
      { "@type": "Country", name: "Pakistan" },
    ],
    sameAs: [STORE_INSTAGRAM, STORE_FACEBOOK],
  };
}

export function siteGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      storeJsonLd(),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "en-PK",
        publisher: { "@id": STORE_ID },
      },
    ],
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
