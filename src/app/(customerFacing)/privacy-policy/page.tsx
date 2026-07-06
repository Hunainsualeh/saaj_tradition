import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Saaj Tradition collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
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
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Privacy Policy
          </h1>
          <p className="text-stone-500 text-sm max-w-md leading-relaxed">
            Last updated: March 2026. Your privacy matters to us.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 space-y-12">

        <Section title="Information We Collect">
          <p>We collect information you provide directly, including:</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>Contact details</strong> — name, email address, phone number.
            </li>
            <li>
              <strong>Delivery information</strong> — shipping address, city,
              province, and postcode.
            </li>
            <li>
              <strong>Order details</strong> — the items you purchase, quantities,
              and prices.
            </li>
            <li>
              <strong>Communications</strong> — messages or enquiries you send us.
            </li>
          </ul>
          <p>
            We do not store payment card details. Online payments are processed
            securely through PayFast, which has its own privacy policy.
          </p>
        </Section>

        <Section title="How We Use Your Information">
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>To process and fulfil your orders.</li>
            <li>To send you order confirmations and shipping updates.</li>
            <li>
              To send our newsletter — only if you have subscribed. You can
              unsubscribe at any time.
            </li>
            <li>To respond to your questions and support requests.</li>
            <li>To improve our website and products.</li>
          </ul>
        </Section>

        <Section title="Sharing Your Information">
          <p>
            We do not sell or rent your personal information. We share data only
            when necessary to fulfil your order or operate our service:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>Delivery partners</strong> — to arrange shipment of your
              order.
            </li>
            <li>
              <strong>Payment processors</strong> — PayFast, to handle online
              payments securely.
            </li>
            <li>
              <strong>Email service providers</strong> — to send transactional and
              marketing emails.
            </li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your order and account information for as long as needed to
            provide our services and comply with legal obligations. You may request
            deletion of your personal data at any time by contacting us.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Our website uses essential cookies to keep your shopping cart working
            and to remember your session. We may also use analytics cookies to
            understand how visitors use the site. No tracking cookies are shared
            with third-party advertisers.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your data.</li>
            <li>Opt out of marketing emails at any time.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a
              href="mailto:info@saajtraidtion.com"
              className="underline underline-offset-2 text-amber-800 hover:text-amber-900 transition-colors"
            >
              info@saajtraidtion.com
            </a>
            .
          </p>
        </Section>

        <Section title="Security">
          <p>
            We take reasonable technical measures to protect your information from
            unauthorised access, loss, or misuse. However, no transmission over
            the internet is completely secure, and we cannot guarantee absolute
            security.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this policy from time to time. Changes will be posted on
            this page with a revised date. We encourage you to review this page
            periodically.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any privacy-related questions, contact us at{" "}
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
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
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
