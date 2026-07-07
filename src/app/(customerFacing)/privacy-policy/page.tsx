import type { Metadata } from "next";

import { PolicyLayout, PolicyCard } from "@/components/common/PolicyPage";
import { STORE_EMAIL } from "@/lib/constants/store-information";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Saaj Tradition collects, uses, and protects your personal information.",
};

const mailto = `mailto:${STORE_EMAIL}`;

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" subtitle="Last updated · March 2026">
      <PolicyCard title="Information We Collect">
        <p>We collect information you provide directly, including:</p>
        <ul>
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
      </PolicyCard>

      <PolicyCard title="How We Use Your Information">
        <ul>
          <li>To process and fulfil your orders.</li>
          <li>To send you order confirmations and shipping updates.</li>
          <li>
            To send our newsletter — only if you have subscribed. You can
            unsubscribe at any time.
          </li>
          <li>To respond to your questions and support requests.</li>
          <li>To improve our website and products.</li>
        </ul>
      </PolicyCard>

      <PolicyCard title="Sharing Your Information">
        <p>
          We do not sell or rent your personal information. We share data only
          when necessary to fulfil your order or operate our service:
        </p>
        <ul>
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
      </PolicyCard>

      <PolicyCard title="Data Retention">
        <p>
          We retain your order and account information for as long as needed to
          provide our services and comply with legal obligations. You may request
          deletion of your personal data at any time by contacting us.
        </p>
      </PolicyCard>

      <PolicyCard title="Cookies">
        <p>
          Our website uses essential cookies to keep your shopping cart working
          and to remember your session. We may also use analytics cookies to
          understand how visitors use the site. No tracking cookies are shared
          with third-party advertisers.
        </p>
      </PolicyCard>

      <PolicyCard title="Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your data.</li>
          <li>Opt out of marketing emails at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{" "}
          <a href={mailto}>{STORE_EMAIL}</a>.
        </p>
      </PolicyCard>

      <PolicyCard title="Security">
        <p>
          We take reasonable technical measures to protect your information from
          unauthorised access, loss, or misuse. However, no transmission over the
          internet is completely secure, and we cannot guarantee absolute
          security.
        </p>
      </PolicyCard>

      <PolicyCard title="Changes to This Policy">
        <p>
          We may update this policy from time to time. Changes will be posted on
          this page with a revised date. We encourage you to review this page
          periodically.
        </p>
      </PolicyCard>

      <PolicyCard title="Contact">
        <p>
          For any privacy-related questions, contact us at{" "}
          <a href={mailto}>{STORE_EMAIL}</a>.
        </p>
      </PolicyCard>
    </PolicyLayout>
  );
}
