import { AnimateFadeIn, CustomLink } from "@/components";
import { routes, STORE_EMAIL, STORE_PHONE, STORE_INSTAGRAM, STORE_FACEBOOK } from "@/lib";

import { FooterGradientBrandName } from "./FooterGradientBrandName";
import { NewsletterForm } from "./NewsletterForm";

type FooterProps = {
  email?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  twitter?: string;
  tiktok?: string;
};

export function Footer({
  email = STORE_EMAIL,
  instagram = STORE_INSTAGRAM,
  facebook = STORE_FACEBOOK,
  whatsapp,
  twitter,
  tiktok,
}: FooterProps = {}) {
  return (
    <div className="bg-black">
      <footer className="bg-black mx-auto py-10 px-5 md:px-10 xl:px-11 flex flex-col">
        <AnimateFadeIn className="flex flex-col md:flex-row justify-between w-full">
          <div className="flex flex-col pb-10 md:pb-0">
            <h3 className="mb-6 text-white">Saaj Tradition</h3>
            <div className="flex flex-col gap-2">
              <CustomLink
                variant="on-dark-secondary"
                href={`mailto:${email}`}
                text={email}
              />
              <CustomLink
                variant="on-dark-secondary"
                href={`tel:${STORE_PHONE}`}
                text={STORE_PHONE}
              />
            </div>
          </div>

          <div className="flex">
            <div className="flex flex-col gap-1 w-[150px]">
              <CustomLink variant="on-dark" href={routes.home} text="Home" />
              <CustomLink variant="on-dark" href={routes.about} text="About" />
              <CustomLink
                variant="on-dark"
                href={routes.location}
                text="Location"
              />
              <CustomLink variant="on-dark" href={routes.blog} text="Blog" />
            </div>
            <div className="flex flex-col gap-1 w-[150px]">
              <CustomLink variant="on-dark" href={routes.shop} text="Shop" />
              <CustomLink
                variant="on-dark"
                href={routes.shopNewArrivals}
                text="New Arrivals"
              />
              <CustomLink
                variant="on-dark"
                href={routes.shopCollections}
                text="Collections"
              />
            </div>
          </div>
        </AnimateFadeIn>
        
        {/* Social icons */}
        <AnimateFadeIn className="flex items-center gap-5 mt-8 md:mt-2">
          <a
            href={`mailto:${email}`}
            aria-label="Email us"
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </a>
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
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
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="text-white/50 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </a>
          )}
          {twitter && (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Twitter / X"
              className="text-white/50 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          )}
          {tiktok && (
            <a
              href={tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on TikTok"
              className="text-white/50 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.18 8.18 0 0 0 4.8 1.55V6.84a4.85 4.85 0 0 1-1.03-.15z"/>
              </svg>
            </a>
          )}
        </AnimateFadeIn>

        <AnimateFadeIn className="flex flex-col mt-10 gap-10 xl:gap-0 xl:flex-row items-center">
          <div className="w-full xl:w-7/12 order-2 xl:order-1">
            <FooterGradientBrandName />
          </div>
          <div className="w-full xl:w-5/12 flex flex-col gap-4 order-1 xl:order-2">
            <NewsletterForm />
            
          </div>
        </AnimateFadeIn>
      </footer>
    </div>
  );
}
