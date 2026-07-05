import type { Metadata } from "next";

import { AdminHeading } from "@/components/admin";
import { AdminSiteContentForm } from "@/components/admin/forms/AdminSiteContentForm";
import { prisma } from "@/lib/prisma";
import { getAllProductsBasic } from "@/lib/server/queries";
import { seedSiteContentDefaults } from "./seed";

export const metadata: Metadata = { title: "Site Content" };

export default async function Page() {
  // Ensure all default keys exist in DB
  await seedSiteContentDefaults();

  // Always query DB directly — admin pages don't need unstable_cache,
  // and this guarantees newly-seeded rows always appear immediately.
  const [items, productsResult] = await Promise.all([
    prisma.siteContent.findMany({ orderBy: { key: "asc" } }),
    getAllProductsBasic(),
  ]);

  const products = productsResult.success ? productsResult.data : [];

  return (
    <div>
      <AdminHeading heading="Site Content" />
      <AdminSiteContentForm items={items} products={products} />
    </div>
  );
}
