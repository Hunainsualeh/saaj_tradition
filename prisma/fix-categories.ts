import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fix() {
  const cats = await prisma.category.findMany();
  const slugToId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  // Fix Gold Khussa Flats -> Shoes
  await prisma.product.update({
    where: { slug: "gold-khussa-flats" },
    data: { categories: { connect: { id: slugToId["shoes"] } } },
  });
  console.log("Fixed: Gold Khussa Flats -> Shoes");

  // Fix Pearl Jhumka Earrings -> Bags & Accessories
  await prisma.product.update({
    where: { slug: "pearl-jhumka-earrings" },
    data: { categories: { connect: { id: slugToId["bags-accessories"] } } },
  });
  console.log("Fixed: Pearl Jhumka Earrings -> Bags & Accessories");

  await prisma.$disconnect();
}

fix();
