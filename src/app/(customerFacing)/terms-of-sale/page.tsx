import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "Terms and conditions governing purchases made at Saaj Tradition.",
};

export default function TermsOfSalePage() {
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
            Terms of Sale
          </h1>
          <p className="text-stone-500 text-sm max-w-md leading-relaxed">
            The following terms apply to all purchases made through our website.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 space-y-12">

        <Section title="Placing an Order">
          <p>
            By completing your order, you make an offer to purchase the selected
            products at the stated price. Your order is confirmed once you receive
            an order confirmation email from us.
          </p>
          <p>
            We reserve the right to cancel or refuse any order at our discretion,
            for example if a product is out of stock or if we suspect fraudulent
            activity.
          </p>
        </Section>

        <Section title="Pricing">
          <p>
            All prices are shown in Pakistani Rupees (Rs.) and are inclusive of
            applicable taxes. Prices are subject to change without notice. The
            price charged will be the price displayed at the time your order is
            placed.
          </p>
        </Section>

        <Section title="Payment">
          <p>We accept the following payment methods:</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>Online payment</strong> via PayFast — all major debit and
              credit cards accepted.
            </li>
            <li>
              <strong>Cash on Delivery (COD)</strong> — available for eligible
              delivery areas within Pakistan.
            </li>
          </ul>
          <p>
            For COD orders, full payment is due at the time of delivery. We reserve
            the right to cancel COD orders if delivery attempts are unsuccessful.
          </p>
        </Section>

        <Section title="Shipping">
          <p>
            We ship across Pakistan. Estimated delivery times are shown at
            checkout. Delivery times are estimates and may vary depending on your
            location and courier availability.
          </p>
          <p>
            Shipping charges, if applicable, are calculated at checkout and shown
            before you confirm your order.
          </p>
          <p>
            We are not responsible for delays caused by courier services or
            circumstances beyond our control.
          </p>
        </Section>

        <Section title="Order Cancellations">
          <p>
            Orders may be cancelled before they are dispatched. To request a
            cancellation, please contact us as soon as possible at{" "}
            <a
              href="mailto:info@saajtraidtion.com"
              className="underline underline-offset-2 text-amber-800 hover:text-amber-900 transition-colors"
            >
              info@saajtraidtion.com
            </a>{" "}
            with your order number.
          </p>
          <p>
            Once an order has been dispatched, it cannot be cancelled. Please
            refer to our{" "}
            <Link
              href="/return-policy"
              className="underline underline-offset-2 text-amber-800 hover:text-amber-900 transition-colors"
            >
              Return Policy
            </Link>{" "}
            for options after delivery.
          </p>
        </Section>

        <Section title="Product Availability">
          <p>
            All orders are subject to availability. If an item you have ordered is
            no longer available, we will notify you and offer a full refund or an
            alternative product.
          </p>
        </Section>

        <Section title="Risk and Title">
          <p>
            Risk in the products passes to you on delivery. Ownership of the
            products passes to you once we have received full payment.
          </p>
        </Section>

        <Section title="Consumer Rights">
          <p>
            Nothing in these Terms of Sale affects your statutory rights as a
            consumer. Our{" "}
            <Link
              href="/return-policy"
              className="underline underline-offset-2 text-amber-800 hover:text-amber-900 transition-colors"
            >
              Return Policy
            </Link>{" "}
            sets out your rights in relation to returns and refunds.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any questions about your order or these terms, contact us at{" "}
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
