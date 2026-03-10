import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using the Saaj Tradition website.",
};

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero strip */}
      <div className="bg-white border-b border-stone-100 py-12 px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 text-center">
          <Link href="/">
            <Image
              src="/assets/logo/Saaj Tradition Golden.png"
              alt="Saaj Tradition"
              width={72}
              height={72}
              className="object-contain"
            />
          </Link>
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-medium">
            Saaj Tradition
          </p>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-stone-800 tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Terms of Use
          </h1>
          <p className="text-stone-500 text-sm max-w-md leading-relaxed">
            By visiting or using our website, you agree to the following terms.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 space-y-12">

        <Section title="Acceptance of Terms">
          <p>
            By accessing or using the Saaj Tradition website, you agree to be
            bound by these Terms of Use. If you do not agree, please do not use
            our website.
          </p>
        </Section>

        <Section title="Use of the Website">
          <p>You may use our website for lawful purposes only. You agree not to:</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              Use the site in any way that violates applicable local, national, or
              international law or regulation.
            </li>
            <li>
              Transmit any unsolicited or unauthorised advertising or promotional
              material (spam).
            </li>
            <li>
              Attempt to gain unauthorised access to any part of the website or
              its related systems.
            </li>
            <li>
              Copy, reproduce, or redistribute any content from the website without
              prior written permission.
            </li>
          </ul>
        </Section>

        <Section title="Intellectual Property">
          <p>
            All content on this website — including text, photographs, graphics,
            logos, and design — is the property of Saaj Tradition and is protected
            by applicable intellectual property laws. You may not use our content
            for commercial purposes without our written consent.
          </p>
        </Section>

        <Section title="Product Descriptions">
          <p>
            We make every effort to display our products accurately. Colours may
            appear slightly different on screen depending on your device settings.
            We reserve the right to correct any errors or omissions and to update
            information at any time without notice.
          </p>
        </Section>

        <Section title="Links to Other Websites">
          <p>
            Our website may contain links to third-party websites for your
            convenience. We do not control those websites and are not responsible
            for their content or privacy practices.
          </p>
        </Section>

        <Section title="Disclaimer of Warranties">
          <p>
            Our website is provided on an &quot;as is&quot; basis. We make no
            warranties, express or implied, regarding the availability, accuracy,
            or reliability of the website or its content.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Saaj Tradition shall not be
            liable for any indirect, incidental, or consequential damages arising
            from your use of the website or inability to use it.
          </p>
        </Section>

        <Section title="Changes to These Terms">
          <p>
            We may update these Terms of Use at any time. Continued use of the
            website after changes are posted constitutes acceptance of the revised
            terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Reach us at{" "}
            <a
              href="mailto:info@saajtraidtion.com"
              className="underline underline-offset-2 text-amber-800 hover:text-amber-900 transition-colors"
            >
              info@saajtraidtion.com
            </a>
            .
          </p>
        </Section>

        <PolicyFooter />
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2
        className="text-lg font-semibold text-stone-800 tracking-tight border-b border-stone-200 pb-2"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {title}
      </h2>
      <div className="text-stone-600 leading-relaxed text-[15px] space-y-3">
        {children}
      </div>
    </section>
  );
}

function PolicyFooter() {
  return (
    <div className="pt-10 border-t border-stone-200 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-stone-400">
      <Link href="/return-policy" className="hover:text-stone-600 transition-colors">
        Return Policy
      </Link>
      <Link href="/terms-of-sale" className="hover:text-stone-600 transition-colors">
        Terms of Sale
      </Link>
      <Link href="/terms-of-use" className="hover:text-stone-600 transition-colors">
        Terms of Use
      </Link>
      <Link href="/privacy-policy" className="hover:text-stone-600 transition-colors">
        Privacy Policy
      </Link>
    </div>
  );
}
