import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return Policy",
  description: "Saaj Tradition return and exchange policy.",
};

export default function ReturnPolicyPage() {
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
            Return Policy
          </h1>
          <p className="text-stone-500 text-sm max-w-md leading-relaxed">
            We stand behind every piece we create. Here is everything you need to
            know about returns and exchanges.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 space-y-12">

        <Section title="Our Commitment">
          <p>
            At Saaj Tradition, each garment is crafted with care and inspected before
            it leaves our hands. If something is not right, we will make it right.
          </p>
        </Section>

        <Section title="Returns">
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              Returns are accepted within <strong>7 days</strong> of delivery.
            </li>
            <li>
              Items must be unworn, unwashed, and in their original packaging with
              tags attached.
            </li>
            <li>
              Items purchased on sale or during a promotional event are
              final sale and cannot be returned.
            </li>
            <li>
              We do not accept returns on custom or made-to-order pieces.
            </li>
          </ul>
        </Section>

        <Section title="Exchanges">
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              Exchanges are accepted within <strong>7 days</strong> of delivery for
              a different size or colour, subject to availability.
            </li>
            <li>
              If your item arrives damaged or defective, we will exchange it at no
              additional cost.
            </li>
          </ul>
        </Section>

        <Section title="How to Initiate a Return or Exchange">
          <ol className="list-decimal list-outside pl-5 space-y-3">
            <li>
              Email us at{" "}
              <a
                href="mailto:info@saajtraidtion.com"
                className="underline underline-offset-2 text-amber-800 hover:text-amber-900 transition-colors"
              >
                info@saajtraidtion.com
              </a>{" "}
              with your order number and a brief description of the issue.
            </li>
            <li>
              Our team will respond within 1–2 business days with the return
              address and instructions.
            </li>
            <li>
              Pack the item securely. We recommend using the original packaging.
            </li>
            <li>
              Once we receive and inspect the item, your exchange or refund will be
              processed within 5–7 business days.
            </li>
          </ol>
        </Section>

        <Section title="Shipping Costs">
          <p>
            Return shipping costs are the customer&apos;s responsibility unless the item
            was damaged or incorrect. We will cover the shipping cost for any
            replacement sent to you.
          </p>
        </Section>

        <Section title="Refunds">
          <p>
            Approved refunds are issued to the original payment method. For
            Cash on Delivery orders, refunds are issued via bank transfer — please
            include your bank details when contacting us.
          </p>
        </Section>

        <Section title="Questions?">
          <p>
            We are always here to help.{" "}
            <a
              href="mailto:info@saajtraidtion.com"
              className="underline underline-offset-2 text-amber-800 hover:text-amber-900 transition-colors"
            >
              Contact our team
            </a>{" "}
            and we will sort it out together.
          </p>
        </Section>

        <PolicyFooter />
      </div>
    </main>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

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
