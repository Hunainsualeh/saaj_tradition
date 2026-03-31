import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { routes, STORE_EMAIL, STORE_PHONE, STORE_INSTAGRAM, STORE_FACEBOOK } from "@/lib";
import { NewsletterForm } from "./NewsletterForm";

type FooterProps = {
  email?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  twitter?: string;
  tiktok?: string;
};

type SocialLink = { name: string; url: string; renderIcon: () => React.ReactNode };

export function Footer({
  instagram = STORE_INSTAGRAM,
  facebook = STORE_FACEBOOK,
  whatsapp,
  twitter,
  tiktok,
}: FooterProps = {}) {

  const socialLinks: SocialLink[] = [
    {
      name: "Instagram",
      url: instagram,
      renderIcon: () => (
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </>
      ),
    },
    {
      name: "Facebook",
      url: facebook,
      renderIcon: () => (
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      ),
    },
    ...(whatsapp ? [{
      name: "WhatsApp",
      url: whatsapp,
      renderIcon: () => (
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      ),
    }] : []),
    ...(twitter ? [{
      name: "Twitter",
      url: twitter,
      renderIcon: () => (
        <path
          d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
          fill="currentColor"
          stroke="none"
        />
      ),
    }] : []),
    ...(tiktok ? [{
      name: "TikTok",
      url: tiktok,
      renderIcon: () => (
        <path
          d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.18 8.18 0 0 0 4.8 1.55V6.84a4.85 4.85 0 0 1-1.03-.15z"
          fill="currentColor"
          stroke="none"
        />
      ),
    }] : []),
  ];

  const shopLinks = [
    { label: "Shop All", href: routes.shop },
    { label: "New Arrivals", href: routes.shopNewArrivals },
    { label: "Collections", href: routes.shopCollections },
  ];

  const companyLinks = [
    { label: "About", href: routes.about },
    { label: "Location", href: routes.location },
    { label: "Blog", href: routes.blog },
    { label: "Track Order", href: routes.track },
  ];

  return (
    /* Outer bg — Warm white */
    <div className="bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100 relative overflow-hidden pt-20 pb-12 px-4 md:px-8 font-sans">

      {/* ── Floating card — Glassmorphic ── */}
      <div className="max-w-[1280px] mx-auto relative z-20">
        <div className="bg-white/50 backdrop-blur-2xl rounded-[28px] p-8 md:p-12 lg:p-14 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_32px_64px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] relative overflow-hidden">

          {/* Top row: Brand + Links */}
          <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 mb-10">

            {/* ── Brand column ── */}
            <div className="max-w-[320px]">
              {/* Logo & Brand Name — stacked, centered */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-48 h-48 shrink-0 mb-4">
                  <Image
                    src="/assets/logo/Saaj Tradition Golden.png"
                    alt="Saaj Tradition"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className="text-[22px] font-semibold tracking-[0.02em] text-gray-900"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    SAAJ
                  </span>
                  <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-gray-500 -mt-0.5">
                    Tradition
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[18px] leading-relaxed text-gray-500 mb-6 text-center">
                Traditional Bahawalpuri dresses
              </p>

              {/* Social + contact icons row */}
              <div className="flex items-center justify-center gap-4 text-gray-500 mb-6">
                {socialLinks.map(
                  (s) =>
                    s.url && (
                      <a
                        key={s.name}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Follow us on ${s.name}`}
                        className="hover:text-gray-900 transition-colors duration-200"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {s.renderIcon()}
                        </svg>
                      </a>
                    )
                )}
                {/* Email icon */}
                <a
                  href={`mailto:${STORE_EMAIL}`}
                  aria-label="Email us"
                  className="hover:text-gray-900 transition-colors duration-200"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </a>
                {/* Phone icon */}
                <a
                  href={`tel:${STORE_PHONE}`}
                  aria-label="Call us"
                  className="hover:text-gray-900 transition-colors duration-200"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.09 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 2.96 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.1 16l-.18.92z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* ── Links columns ── */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:max-w-xl">

              {/* Shop + Newsletter heading & text below */}
              <div>
                <h3 className="font-semibold text-[14px] text-gray-900 mb-5">
                  Shop
                </h3>
                <ul className="flex flex-col gap-3.5 text-[13px] text-gray-500 mb-8">
                  {shopLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="hover:text-gray-900 transition-colors duration-200">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <h3 className="font-semibold text-[14px] text-gray-900 mb-3">
                  Newsletter
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  New arrivals &amp; exclusive offers — direct to your inbox.
                </p>
              </div>

              {/* Company + pill below */}
              <div>
                <h3 className="font-semibold text-[14px] text-gray-900 mb-5">
                  Company
                </h3>
                <ul className="flex flex-col gap-3.5 text-[13px] text-gray-500 mb-8">
                  {companyLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="hover:text-gray-900 transition-colors duration-200">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <NewsletterForm />
              </div>

            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gray-200 my-8" />

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[12px] text-gray-400">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} Saaj Tradition. All rights reserved.</p>

            {/* Legal links */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-gray-400">
              <Link href={routes.returnPolicy} className="hover:text-gray-600 transition-colors duration-200">Returns</Link>
              <Link href={routes.privacyPolicy} className="hover:text-gray-600 transition-colors duration-200">Privacy</Link>
              <Link href={routes.termsOfUse} className="hover:text-gray-600 transition-colors duration-200">Terms of Use</Link>
              <Link href={routes.termsOfSale} className="hover:text-gray-600 transition-colors duration-200">Terms of Sale</Link>
            </div>

            <p className="text-gray-400">Crafted with care in Pakistan</p>
          </div>

        </div>
      </div>

      {/* ── Watermark ── */}
      <div className="absolute bottom-[-5%] left-0 w-full flex justify-center items-end pointer-events-none z-0 overflow-hidden select-none">
        <h1 className="text-[28vw] sm:text-[22vw] md:text-[18vw] leading-none font-bold text-amber-900/[0.07] tracking-tighter whitespace-nowrap">
          Saaj Tradition
        </h1>
      </div>

    </div>
  );
}