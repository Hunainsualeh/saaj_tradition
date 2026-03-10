/**
 * One-time script to seed Category records and assign existing products.
 * Run: npx tsx prisma/seed-categories.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: "Dresses",
    slug: "dresses",
    tagline: "Timeless elegance in every silhouette.",
    imageUrl: "/assets/store-collection-dresses.jpg",
    sortOrder: 1,
  },
  {
    name: "Outerwear",
    slug: "outerwear",
    tagline: "Impeccable craftsmanship meets modern protection.",
    imageUrl: "/assets/store-collection-outerwear.jpg",
    sortOrder: 2,
  },
  {
    name: "Tops & Bottoms",
    slug: "tops-bottoms",
    tagline: "Essential pieces, elevated design.",
    imageUrl: "/assets/store-collection-tops-bottoms.jpg",
    sortOrder: 3,
  },
  {
    name: "Bags & Accessories",
    slug: "bags-accessories",
    tagline: "The finishing touch to refined style.",
    imageUrl: "/assets/store-collection-bags-accessories.jpg",
    sortOrder: 4,
  },
  {
    name: "Shoes",
    slug: "shoes",
    tagline: "Artisanal footwear for the discerning.",
    imageUrl: "/assets/store-collection-shoes.jpg",
    sortOrder: 5,
  },
];

async function main() {
  console.log("Seeding categories...");

  // Upsert categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, tagline: cat.tagline, imageUrl: cat.imageUrl, sortOrder: cat.sortOrder },
      create: cat,
    });
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // Get all categories keyed by slug
  const allCategories = await prisma.category.findMany();
  const slugToId = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]));

  // Get all products that don't have a category yet (M2M)
  const products = await prisma.product.findMany({
    where: { categories: { none: {} } },
  });

  if (products.length === 0) {
    console.log("All products already have a category. Done!");
    return;
  }

  console.log(`\nAssigning categories to ${products.length} products...`);

  // For each product, try to figure out its category from its name/slug
  // Since the old enum column was dropped, we need heuristics based on the seed data
  // Or we can just assign the "Dresses" category as default for Pakistani boutique products
  const dressesId = slugToId["dresses"];

  // Auto-detect category from product slug patterns
  for (const product of products) {
    let categoryId = dressesId; // default

    const slug = product.slug.toLowerCase();
    const name = product.name.toLowerCase();

    if (
      slug.includes("handbag") || slug.includes("tote") || slug.includes("clutch") ||
      slug.includes("bag") || slug.includes("accessori") || slug.includes("scarf") ||
      name.includes("handbag") || name.includes("tote") || name.includes("clutch") ||
      name.includes("bag") || name.includes("scarf")
    ) {
      categoryId = slugToId["bags-accessories"];
    } else if (
      slug.includes("shoe") || slug.includes("sandal") || slug.includes("heel") ||
      slug.includes("juttis") || slug.includes("kolhapuri") || slug.includes("chappal") ||
      name.includes("shoe") || name.includes("sandal") || name.includes("heel") ||
      name.includes("juttis") || name.includes("kolhapuri") || name.includes("chappal")
    ) {
      categoryId = slugToId["shoes"];
    } else if (
      slug.includes("coat") || slug.includes("jacket") || slug.includes("shawl") ||
      slug.includes("pashmina") || slug.includes("cape") ||
      name.includes("coat") || name.includes("jacket") || name.includes("shawl") ||
      name.includes("pashmina") || name.includes("cape")
    ) {
      categoryId = slugToId["outerwear"];
    } else if (
      slug.includes("trouser") || slug.includes("palazzo") || slug.includes("culottes") ||
      slug.includes("pants") || slug.includes("top") || slug.includes("blouse") ||
      name.includes("trouser") || name.includes("palazzo") || name.includes("culottes") ||
      name.includes("pants") || name.includes("silk top") || name.includes("blouse")
    ) {
      categoryId = slugToId["tops-bottoms"];
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { categories: { connect: { id: categoryId } } },
    });

    const catName = allCategories.find((c) => c.id === categoryId)?.name ?? "Unknown";
    console.log(`  ✓ ${product.name} → ${catName}`);
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
