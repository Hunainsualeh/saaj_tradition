import Image from "next/image";
import Link from "next/link";

import { getButtonStyles } from "@/components";
import { routes } from "@/lib/routing/routes";

type PolicyLayoutProps = {
  /** Big uppercase page title, e.g. "Privacy Policy". */
  title: string;
  /** Small tracked sub-line under the title (e.g. the last-updated date). */
  subtitle?: string;
  /** Blurred brand image behind the glass content. */
  backgroundImage?: string;
  children: React.ReactNode;
};

const POLICY_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/terms-of-sale", label: "Terms of Sale" },
  { href: "/terms-of-use", label: "Terms of Use" },
];

/**
 * Shared shell for every legal/policy page. It intentionally mirrors the order
 * confirmation ("Thank You") page: a fixed, blurred brand image sits behind a
 * stack of frosted-glass note cards, with a centred logo, oversized uppercase
 * title, and the same diamond divider. Fully responsive (single column, fluid
 * type). Content is passed in as <PolicyCard> children.
 */
export function PolicyLayout({
  title,
  subtitle,
  backgroundImage = "/assets/hero-landing.jpg",
  children,
}: PolicyLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* ── Background (blurred brand image + white veil) ── */}
      <div className="fixed inset-0 -z-10">
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {/* ── Header ── */}
        <div className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <Link href={routes.home} aria-label="Saaj Tradition — home">
              <Image
                src="/assets/logo/Saaj Tradition Golden.png"
                alt="Saaj Tradition"
                width={120}
                height={48}
                className="object-contain"
              />
            </Link>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black uppercase text-neutral-11 leading-tight"
            style={{ letterSpacing: "0.08em" }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 text-xs md:text-sm tracking-[0.25em] uppercase text-neutral-08 font-medium">
              {subtitle}
            </p>
          )}

          <div className="mt-4 flex justify-center">
            <div className="w-12 h-px bg-neutral-11 opacity-30" />
            <div className="mx-3 w-2 h-2 rotate-45 border border-neutral-11 opacity-40 -mt-[3px]" />
            <div className="w-12 h-px bg-neutral-11 opacity-30" />
          </div>
        </div>

        {/* ── Content cards ── */}
        <div className="space-y-6">{children}</div>

        {/* ── Actions ── */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={routes.home}
            className={getButtonStyles("dark", "justify-center px-8")}
          >
            Go Home
          </Link>
          <Link
            href={routes.shop}
            className={getButtonStyles("light", "justify-center px-8")}
          >
            Continue Shopping
          </Link>
        </div>

        {/* ── Cross-links to the other policies ── */}
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center text-[13px] text-neutral-08">
          {POLICY_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-neutral-11 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
