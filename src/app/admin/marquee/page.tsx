import type { Metadata } from "next";

import { AdminHeading } from "@/components/admin";
import { AdminMarqueeForm } from "@/components/admin/forms/AdminMarqueeForm";
import { getAllSiteContent, getAllProductsBasic } from "@/lib/server/queries";
import { seedSiteContentDefaults } from "../site-content/seed";

export const metadata: Metadata = { title: "Announcement" };

const MARQUEE_KEYS = new Set([
  "announcement_active",
  "announcement_bg_color",
  "announcement_text_color",
  "announcement_separator_color",
  "announcement_texts",
  "product_marquee_active",
  "marquee_product_ids",
  "partners_marquee_active",
  "partners_heading",
  "partners_logos",
]);

export default async function AdminMarqueePage() {
  await seedSiteContentDefaults();

  const [contentResult, productsResult] = await Promise.all([
    getAllSiteContent(),
    getAllProductsBasic(),
  ]);

  if (!contentResult.success) {
    return <div>Error loading settings: {contentResult.error}</div>;
  }

  const marqueeItems = contentResult.data.filter((item) =>
    MARQUEE_KEYS.has(item.key),
  );

  const allProducts = productsResult.success ? productsResult.data : [];

  return (
    <div>
      <AdminHeading heading="Announcement" />
      <p className="text-neutral-10 text-sm mb-6">
        Control the scrolling marquee strips shown on the storefront. Toggle
        each section on or off and edit its content below.
      </p>
      <AdminMarqueeForm items={marqueeItems} allProducts={allProducts} />
    </div>
  );
}
