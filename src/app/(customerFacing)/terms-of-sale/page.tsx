import Link from "next/link";
import type { Metadata } from "next";

import { PolicyLayout, PolicyCard } from "@/components/common/PolicyPage";
import { STORE_EMAIL } from "@/lib/constants/store-information";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "Terms and conditions governing purchases made at Saaj Tradition.",
};

const mailto = `mailto:${STORE_EMAIL}`;

export default function TermsOfSalePage() {
  return (
    <PolicyLayout
      title="Terms of Sale"
      subtitle="Purchases · Payment · Shipping"
    >
      <PolicyCard title="Placing an Order">
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
      </PolicyCard>

      <PolicyCard title="Pricing">
        <p>
          All prices are shown in Pakistani Rupees (Rs.) and are inclusive of
          applicable taxes. Prices are subject to change without notice. The price
          charged will be the price displayed at the time your order is placed.
        </p>
      </PolicyCard>

      <PolicyCard title="Payment">
        <p>We accept the following payment methods:</p>
        <ul>
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
      </PolicyCard>

      <PolicyCard title="Shipping">
        <p>
          We ship across Pakistan. Estimated delivery times are shown at checkout
          and may vary depending on your location and courier availability.
        </p>
        <p>
          Shipping charges, if applicable, are calculated at checkout and shown
          before you confirm your order.
        </p>
        <p>
          We are not responsible for delays caused by courier services or
          circumstances beyond our control.
        </p>
      </PolicyCard>

      <PolicyCard title="Order Cancellations">
        <p>
          Orders may be cancelled before they are dispatched. To request a
          cancellation, please contact us as soon as possible at{" "}
          <a href={mailto}>{STORE_EMAIL}</a> with your order number.
        </p>
        <p>
          Once an order has been dispatched, it cannot be cancelled. Please refer
          to our <Link href="/return-policy">Return Policy</Link> for options
          after delivery.
        </p>
      </PolicyCard>

      <PolicyCard title="Product Availability">
        <p>
          All orders are subject to availability. If an item you have ordered is
          no longer available, we will notify you and offer a full refund or an
          alternative product.
        </p>
      </PolicyCard>

      <PolicyCard title="Risk and Title">
        <p>
          Risk in the products passes to you on delivery. Ownership of the
          products passes to you once we have received full payment.
        </p>
      </PolicyCard>

      <PolicyCard title="Consumer Rights">
        <p>
          Nothing in these Terms of Sale affects your statutory rights as a
          consumer. Our <Link href="/return-policy">Return Policy</Link> sets out
          your rights in relation to returns and refunds.
        </p>
      </PolicyCard>

      <PolicyCard title="Contact">
        <p>
          For any questions about your order or these terms, contact us at{" "}
          <a href={mailto}>{STORE_EMAIL}</a>.
        </p>
      </PolicyCard>
    </PolicyLayout>
  );
}
