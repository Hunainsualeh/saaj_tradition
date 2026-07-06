import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} antialiased relative`}>
        {children}
      </body>
    </html>
  );
}
