import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import {
  STORE_EMAIL,
  STORE_PHONE,
  STORE_INSTAGRAM,
  STORE_FACEBOOK,
} from "@/lib/constants/store-information";

const SITE_URL = "https://saajtradition.com";

// Site-wide structured data. The ClothingStore node is the brand "entity"
// Google uses to recognise Saaj Tradition in search (Knowledge Panel / brand
// results); the WebSite node ties the domain to that entity. Product pages add
// their own Product JSON-LD on top of this.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ClothingStore",
      "@id": `${SITE_URL}/#store`,
      name: "Saaj Tradition",
      url: SITE_URL,
      logo: `${SITE_URL}/assets/logo/Saaj%20Tradition%20Golden.png`,
      image: `${SITE_URL}/assets/og-image.jpg`,
      description:
        "Traditional Bahawalpuri dresses — curated fashion, premium essentials and designer-inspired collections.",
      email: STORE_EMAIL,
      telephone: STORE_PHONE,
      address: {
        "@type": "PostalAddress",
        streetAddress: "1/2 km KLP Road, near Hotel Pearl Resort",
        addressLocality: "Ahmedpur East",
        addressRegion: "Punjab",
        postalCode: "63350",
        addressCountry: "PK",
      },
      sameAs: [STORE_INSTAGRAM, STORE_FACEBOOK],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Saaj Tradition",
      publisher: { "@id": `${SITE_URL}/#store` },
    },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Playfair Display is the brand display serif — used for the "SAAJ" wordmark and
// section/policy headings. It was previously referenced by inline
// `font-family: 'Playfair Display', …` styles but never actually loaded on the
// storefront (only Inter was), so those elements silently fell back to Georgia.
// Self-hosting it here via next/font (subset + swap, no render-blocking external
// stylesheet) makes the intended brand type render. Exposed as `--font-playfair`
// so the inline styles resolve to the real self-hosted family.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Saaj Tradition",
    template: "%s | Saaj Tradition",
  },
  description:
    "Saaj Tradition — Traditional Bahawalpuri dresses. Explore curated fashion, premium essentials, and designer-inspired collections.",
  applicationName: "Saaj Tradition",
  keywords: [
    "traditional dresses",
    "bahawalpuri dresses",
    "fashion",
    "designer",
    "premium apparel",
    "saaj tradition",
  ],
  metadataBase: new URL("https://saajtradition.com"),
  // NOTE: no site-wide `alternates.canonical` here — in the App Router it would
  // cascade "/" onto every page that doesn't override it, flagging them as
  // duplicates of the homepage. Canonicals are set per-page instead.
  // Explicitly invite indexing and allow large image/text previews in results
  // (better for an image-led fashion catalogue).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION once the property is claimed in
  // Google Search Console (Settings → Ownership → HTML tag) to verify the site.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    title: "Saaj Tradition",
    description:
      "Traditional Bahawalpuri dresses — curated fashion and premium essentials.",
    type: "website",
    siteName: "Saaj Tradition",
    images: [
      {
        url: "/assets/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Saaj Tradition — Traditional Bahawalpuri Dresses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saaj Tradition",
    description:
      "Traditional Bahawalpuri dresses — curated fashion and premium essentials.",
    images: ["/assets/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/assets/logo/Saaj Tradition Golden.png", type: "image/png" },
    ],
    apple: "/assets/logo/Saaj Tradition Golden.png",
    shortcut: "/assets/logo/Saaj Tradition Golden.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Every product/category/blog image is now delivered directly from
            Cloudinary's CDN (see src/lib/image-loader.ts). Warming the DNS + TLS
            connection early removes it from the image critical path. No
            crossOrigin: <img> requests are not CORS, so a plain preconnect is
            what the browser reuses. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased relative`}
      >
        {/* Site-wide brand + website structured data (helps Google recognise
            "Saaj Tradition" as a brand entity in search results). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
