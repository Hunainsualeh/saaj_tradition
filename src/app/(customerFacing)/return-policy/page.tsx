import type { Metadata } from "next";

import { PolicyLayout, PolicyCard } from "@/components/common/PolicyPage";
import { STORE_EMAIL } from "@/lib/constants/store-information";

export const metadata: Metadata = {
  title: "Return Policy",
  description: "Saaj Tradition return, exchange, and refund policy.",
};

const mailto = `mailto:${STORE_EMAIL}`;

export default function ReturnPolicyPage() {
  return (
    <PolicyLayout
      title="Return Policy"
      subtitle="Returns · Exchanges · Refunds"
    >
      <PolicyCard title="Our Commitment">
        <p>
          At Saaj Tradition, each garment is crafted with care and inspected
          before it leaves our hands. If something is not right, we will make it
          right.
        </p>
      </PolicyCard>

      <PolicyCard title="Returns">
        <ul>
          <li>
            Returns are accepted within <strong>7 days</strong> of delivery.
          </li>
          <li>
            Items must be unworn, unwashed, and in their original packaging with
            tags attached.
          </li>
          <li>
            Items purchased on sale or during a promotional event are final sale
            and cannot be returned.
          </li>
          <li>We do not accept returns on custom or made-to-order pieces.</li>
        </ul>
      </PolicyCard>

      <PolicyCard title="Exchanges">
        <ul>
          <li>
            Exchanges are accepted within <strong>7 days</strong> of delivery for
            a different size or colour, subject to availability.
          </li>
          <li>
            If your item arrives damaged or defective, we will exchange it at no
            additional cost.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard title="How to Initiate a Return or Exchange">
        <ol>
          <li>
            Email us at <a href={mailto}>{STORE_EMAIL}</a> with your order number
            and a brief description of the issue.
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
      </PolicyCard>

      <PolicyCard title="Refunds">
        <p>
          Approved refunds are returned to your original payment method. For{" "}
          <strong>Cash on Delivery</strong> orders, refunds are issued via bank
          transfer — please include your bank details when contacting us. Original
          shipping charges are non-refundable unless the item was damaged or
          defective.
        </p>
      </PolicyCard>

      <PolicyCard title="Questions?">
        <p>
          We are always here to help. <a href={mailto}>Contact our team</a> and we
          will sort it out together.
        </p>
      </PolicyCard>
    </PolicyLayout>
  );
}
