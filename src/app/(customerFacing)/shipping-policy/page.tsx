import Link from "next/link";
import type { Metadata } from "next";

import { PolicyLayout, PolicyCard } from "@/components/common/PolicyPage";
import { STORE_EMAIL } from "@/lib/constants/store-information";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "How Saaj Tradition processes, ships, and delivers orders across Pakistan.",
};

const mailto = `mailto:${STORE_EMAIL}`;

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping Policy"
      subtitle="Processing · Delivery · Tracking"
    >
      <PolicyCard title="Where We Ship">
        <p>
          We currently ship across Pakistan only. Orders are delivered
          nationwide through trusted courier partners.
        </p>
      </PolicyCard>

      <PolicyCard title="Order Processing">
        <p>
          Orders are processed within <strong>1–2 business days</strong> after
          they are confirmed. Orders placed on weekends or public holidays are
          processed on the next business day.
        </p>
        <p>
          You will receive an order confirmation by email once your order is
          placed, and a further update once it has been dispatched.
        </p>
      </PolicyCard>

      <PolicyCard title="Delivery Time">
        <p>
          Estimated delivery is <strong>3–7 business days</strong> from
          dispatch, depending on your city and courier availability. Remote
          areas may take slightly longer.
        </p>
        <p>
          Estimated delivery times are indicative and not guaranteed. We are not
          responsible for delays caused by courier services or circumstances
          beyond our control.
        </p>
      </PolicyCard>

      <PolicyCard title="Shipping Charges">
        <p>
          Shipping charges, if applicable, are calculated and shown at checkout
          before you confirm your order. Any promotional free-shipping offers
          will be applied automatically when eligible.
        </p>
      </PolicyCard>

      <PolicyCard title="Cash on Delivery">
        <p>
          Cash on Delivery (COD) is available for eligible areas within
          Pakistan. For COD orders, the full amount is payable to the courier at
          the time of delivery.
        </p>
      </PolicyCard>

      <PolicyCard title="Order Tracking">
        <p>
          Once your order has been dispatched, you can request tracking details
          by emailing us at <a href={mailto}>{STORE_EMAIL}</a> with your order
          number. Our team will share the courier and tracking information.
        </p>
      </PolicyCard>

      <PolicyCard title="Incorrect Address or Failed Delivery">
        <p>
          Please ensure your delivery address and phone number are correct at
          checkout. If a delivery fails because of an incorrect address or an
          unreachable contact number, we may need to arrange re-delivery, which
          can incur additional charges.
        </p>
      </PolicyCard>

      <PolicyCard title="Damaged or Incorrect Items">
        <p>
          If your order arrives damaged or you receive the wrong item, please
          contact us within 48 hours of delivery. See our{" "}
          <Link href="/return-policy">Return Policy</Link> for how returns,
          exchanges, and refunds are handled.
        </p>
      </PolicyCard>

      <PolicyCard title="Contact">
        <p>
          For any questions about shipping or delivery, contact us at{" "}
          <a href={mailto}>{STORE_EMAIL}</a>.
        </p>
      </PolicyCard>
    </PolicyLayout>
  );
}
