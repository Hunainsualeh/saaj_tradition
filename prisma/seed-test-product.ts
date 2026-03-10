/**
 * Creates a minimal "PayFast Test Product" for end-to-end payment testing.
 * Safe to run multiple times — skips creation if slug already exists.
 *
 * Run: npx tsx prisma/seed-test-product.ts
 */

import { PrismaClient, SizeTypeEnum } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Ensure "Test" category exists ─────────────────────────────────────
  const category = await prisma.category.upsert({
    where: { slug: "test" },
    update: {},
    create: {
      name: "Test",
      slug: "test",
      tagline: "Test products",
      imageUrl: "",
      sortOrder: 99,
    },
  });
  console.log("✓ category:", category.slug);

  // ── 2. Create/upsert the test product ─────────────────────────────────────
  const existing = await prisma.product.findUnique({
    where: { slug: "payfast-test-product" },
    include: { sizes: true },
  });

  if (existing) {
    console.log("✓ product already exists:", existing.id);
    console.log("  sizes:", existing.sizes.map((s) => `${s.label} (stock ${s.stockTotal})`));
    console.log("\nDone — no changes needed.");
    return;
  }

  const product = await prisma.product.create({
    data: {
      name: "PayFast Test Product",
      description: "A dummy product used exclusively for testing the PayFast payment gateway end-to-end. Do not display in production.",
      price: 100, // PKR 100 — lowest PayFast UAT amount
      compareAtPrice: null,
      isActive: true,
      isFeatured: false,
      images: [],
      slug: "payfast-test-product",
      categories: { connect: { id: category.id } },
      sizeType: SizeTypeEnum.OneSize,
      sizes: {
        create: [
          {
            label: "One Size",
            stockTotal: 50,
            stockReserved: 0,
          },
        ],
      },
    },
    include: { sizes: true },
  });

  console.log("✓ created product:", product.id, product.slug);
  console.log("  sizes:", product.sizes.map((s) => `${s.label} (stock ${s.stockTotal})`));
  console.log("\nTest product URL: /product/payfast-test-product");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
