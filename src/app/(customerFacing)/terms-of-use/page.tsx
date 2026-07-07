import type { Metadata } from "next";

import { PolicyLayout, PolicyCard } from "@/components/common/PolicyPage";
import { STORE_EMAIL } from "@/lib/constants/store-information";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using the Saaj Tradition website.",
};

const mailto = `mailto:${STORE_EMAIL}`;

export default function TermsOfUsePage() {
  return (
    <PolicyLayout title="Terms of Use" subtitle="Website Terms & Conditions">
      <PolicyCard title="Acceptance of Terms">
        <p>
          By accessing or using the Saaj Tradition website, you agree to be bound
          by these Terms of Use. If you do not agree, please do not use our
          website.
        </p>
      </PolicyCard>

      <PolicyCard title="Use of the Website">
        <p>You may use our website for lawful purposes only. You agree not to:</p>
        <ul>
          <li>
            Use the site in any way that violates applicable local, national, or
            international law or regulation.
          </li>
          <li>
            Transmit any unsolicited or unauthorised advertising or promotional
            material (spam).
          </li>
          <li>
            Attempt to gain unauthorised access to any part of the website or its
            related systems.
          </li>
          <li>
            Copy, reproduce, or redistribute any content from the website without
            prior written permission.
          </li>
        </ul>
      </PolicyCard>

      <PolicyCard title="Intellectual Property">
        <p>
          All content on this website — including text, photographs, graphics,
          logos, and design — is the property of Saaj Tradition and is protected
          by applicable intellectual property laws. You may not use our content
          for commercial purposes without our written consent.
        </p>
      </PolicyCard>

      <PolicyCard title="Product Descriptions">
        <p>
          We make every effort to display our products accurately. Colours may
          appear slightly different on screen depending on your device settings.
          We reserve the right to correct any errors or omissions and to update
          information at any time without notice.
        </p>
      </PolicyCard>

      <PolicyCard title="Links to Other Websites">
        <p>
          Our website may contain links to third-party websites for your
          convenience. We do not control those websites and are not responsible
          for their content or privacy practices.
        </p>
      </PolicyCard>

      <PolicyCard title="Disclaimer of Warranties">
        <p>
          Our website is provided on an &quot;as is&quot; basis. We make no
          warranties, express or implied, regarding the availability, accuracy, or
          reliability of the website or its content.
        </p>
      </PolicyCard>

      <PolicyCard title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Saaj Tradition shall not be
          liable for any indirect, incidental, or consequential damages arising
          from your use of the website or inability to use it.
        </p>
      </PolicyCard>

      <PolicyCard title="Changes to These Terms">
        <p>
          We may update these Terms of Use at any time. Continued use of the
          website after changes are posted constitutes acceptance of the revised
          terms.
        </p>
      </PolicyCard>

      <PolicyCard title="Contact">
        <p>
          Questions about these terms? Reach us at{" "}
          <a href={mailto}>{STORE_EMAIL}</a>.
        </p>
      </PolicyCard>
    </PolicyLayout>
  );
}
