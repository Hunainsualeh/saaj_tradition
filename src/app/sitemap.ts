import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import { routes } from "@/lib/routing/routes";

export const revalidate = 3600;

const STATIC_CONTENT_UPDATED = new Date("2026-09-25T00:00:00.000Z");
const POLICIES_UPDATED = new Date("2026-03-01T00:00:00.000Z");

function url(path: string) {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function newest(dates: Date[], fallback: Date) {
  return dates.reduce((max, d) => (d > max ? d : max), fallback);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date; images: string[] }[] = [];
  let blogs: { slug: string; updatedAt: Date }[] = [];
  let collections: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];
  try {
    [products, blogs, collections, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true, images: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.blogPost.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.collection.findMany({
        where: { products: { some: { isActive: true } } },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.category.findMany({
        where: { products: { some: { isActive: true } } },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
  } catch (error) {
    console.error("[sitemap] DB unreachable — returning static routes only:", error);
  }

  const catalogUpdated = newest(
    products.map((p) => p.updatedAt),
    STATIC_CONTENT_UPDATED,
  );
  const blogUpdated = newest(
    blogs.map((b) => b.updatedAt),
    STATIC_CONTENT_UPDATED,
  );

  const staticPages: MetadataRoute.Sitemap = [
    { url: url(routes.home), lastModified: catalogUpdated, changeFrequency: "daily", priority: 1.0 },
    { url: url(routes.shop), lastModified: catalogUpdated, changeFrequency: "daily", priority: 0.9 },
    { url: url(routes.bahawalpuriSuits), lastModified: STATIC_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: url(routes.location), lastModified: STATIC_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: url(routes.bahawalpurBoutique), lastModified: STATIC_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: url(routes.shopNewArrivals), lastModified: catalogUpdated, changeFrequency: "daily", priority: 0.8 },
    ...(collections.length > 0
      ? [{ url: url(routes.shopCollections), lastModified: catalogUpdated, changeFrequency: "weekly" as const, priority: 0.6 }]
      : []),
    ...(categories.length > 0
      ? [{ url: url(routes.shopCategories), lastModified: catalogUpdated, changeFrequency: "weekly" as const, priority: 0.6 }]
      : []),
    ...(blogs.length > 0
      ? [{ url: url(routes.blog), lastModified: blogUpdated, changeFrequency: "weekly" as const, priority: 0.6 }]
      : []),
    { url: url(routes.about), lastModified: STATIC_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.5 },
    { url: url(routes.support), lastModified: STATIC_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.5 },
    { url: url(routes.shippingPolicy), lastModified: POLICIES_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: url(routes.returnPolicy), lastModified: POLICIES_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: url(routes.privacyPolicy), lastModified: POLICIES_UPDATED, changeFrequency: "yearly", priority: 0.2 },
    { url: url(routes.termsOfSale), lastModified: POLICIES_UPDATED, changeFrequency: "yearly", priority: 0.2 },
    { url: url(routes.termsOfUse), lastModified: POLICIES_UPDATED, changeFrequency: "yearly", priority: 0.2 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: url(`${routes.product}/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
    images: p.images
      .filter((src) => /^https:\/\//.test(src))
      .slice(0, 5),
  }));

  const blogPages: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: url(`${routes.blog}/${b.slug}`),
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: url(`${routes.shopCollections}/${c.slug}`),
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: url(`${routes.shopCategories}/${c.slug}`),
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...collectionPages,
    ...productPages,
    ...blogPages,
  ];
}
