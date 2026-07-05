import { unstable_cache } from "next/cache";
import { cache } from "react";

import { OrderStatus, Prisma } from "@prisma/client";
import { ServerActionResponse } from "@/types/server";
import {
  ProductDashboardStats,
  ProductGetAllCounts,
  ProductWithSizes,
} from "@/types/client";
import { wrapServerCall } from "../helpers";
import { prisma } from "@/lib/prisma";
import { CACHE_TAG_PRODUCT } from "@/lib/constants/cache-tags";
import { SIZE_TEMPLATES, SIZE_TYPES } from "@/lib/constants";
import { SerializedProduct } from "@/types/client";

/** Convert Prisma Product Decimals to plain numbers for client serialization */
function serializeProduct<T extends { price: unknown; compareAtPrice?: unknown; shippingCharge?: unknown; categories?: unknown }>(product: T) {
  // `categories` is optional on the generic but we always want an array in the
  // serialized output that matches `SerializedProduct`.
  const base: Record<string, unknown> = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    shippingCharge: product.shippingCharge != null ? Number(product.shippingCharge) : null,
  };

  if ("categories" in product) {
    base.categories = (product as { categories?: unknown }).categories || [];
  }

  return base;
}

// === STATIC PAGE QUERIES ===
const getThreeLatestProductsCached = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { categories: { select: { name: true, slug: true } } },
    });

    return products.map(serializeProduct) as SerializedProduct[];
  },
  [CACHE_TAG_PRODUCT, "latest-three"],
  { tags: [CACHE_TAG_PRODUCT] },
);

export async function getThreeLatestProducts(): Promise<
  ServerActionResponse<SerializedProduct[]>
> {
  return wrapServerCall(() => getThreeLatestProductsCached());
}

// Featured products for home page new arrivals
const getFeaturedProductsCached = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: { categories: { select: { name: true, slug: true } } },
    });

    return products.map(serializeProduct) as SerializedProduct[];
  },
  [CACHE_TAG_PRODUCT, "featured"],
  { tags: [CACHE_TAG_PRODUCT] },
);

export async function getFeaturedProducts(): Promise<
  ServerActionResponse<SerializedProduct[]>
> {
  return wrapServerCall(() => getFeaturedProductsCached());
}

// Marquee products — by specific IDs or latest 12 active products as fallback.
// Cached (keyed by the id list) so the home page never re-queries on every render.
const getMarqueeProductsCached = unstable_cache(
  async (ids: string[]): Promise<SerializedProduct[]> => {
    if (ids.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        include: { categories: { select: { name: true, slug: true } } },
      });
      // Preserve admin-defined order
      const map = new Map(products.map((p) => [p.id, p]));
      return ids
        .map((id) => map.get(id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
        .map(serializeProduct) as SerializedProduct[];
    }
    // Fallback: latest 12 active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { categories: { select: { name: true, slug: true } } },
    });
    return products.map(serializeProduct) as SerializedProduct[];
  },
  [CACHE_TAG_PRODUCT, "marquee"],
  { tags: [CACHE_TAG_PRODUCT] },
);

export async function getMarqueeProducts(
  ids: string[],
): Promise<ServerActionResponse<SerializedProduct[]>> {
  return wrapServerCall(() => getMarqueeProductsCached(ids));
}

// Minimal product list for admin pickers
export async function getAllProductsBasic(): Promise<
  ServerActionResponse<{ id: string; name: string; images: string[] }[]>
> {
  return wrapServerCall(() =>
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, images: true },
    }),
  );
}

// Cached pool of recent active products. Sampling 3 from this pool in-process
// gives per-request variety WITHOUT a full-table `ORDER BY RANDOM()` scan on
// every product page view. Invalidated on any product mutation via the tag.
const getRelatedProductsPoolCached = unstable_cache(
  async (): Promise<SerializedProduct[]> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    return products.map((p) =>
      serializeProduct({ ...p, categories: [] }),
    ) as SerializedProduct[];
  },
  [CACHE_TAG_PRODUCT, "related-pool"],
  { tags: [CACHE_TAG_PRODUCT] },
);

export async function getThreeRandomProducts(
  currentSlug: string,
): Promise<ServerActionResponse<SerializedProduct[]>> {
  return wrapServerCall(async () => {
    const pool = (await getRelatedProductsPoolCached()).filter(
      (p) => p.slug !== currentSlug,
    );

    // Fisher–Yates shuffle, then take the first 3 for variety per request.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, 3);
  });
}
const getAllProductsWithTotalSoldCached = unstable_cache(
  async (): Promise<ProductGetAllCounts[]> => {
    // Efficiently get total sold per product using a grouped aggregate,
    // instead of loading all cart items into memory.
    const [products, soldAgg] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          compareAtPrice: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
          images: true,
          slug: true,
          sizeType: true,
          categories: { select: { name: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      }),
      // aggregate sold quantity per product for non-cancelled/refunded orders
      prisma.cartItem.groupBy({
        by: ["productId"],
        where: {
          cart: {
            order: {
              status: {
                notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
              },
            },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const soldMap = new Map<string, number>(
      soldAgg.map((s) => [s.productId, s._sum.quantity ?? 0]),
    );

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      images: product.images,
      slug: product.slug,
      sizeType: product.sizeType,
      categoryName: product.categories[0]?.name ?? "Uncategorized",
      totalSold: soldMap.get(product.id) ?? 0,
    }));
  },
  [CACHE_TAG_PRODUCT, "total-sold"],
  { tags: [CACHE_TAG_PRODUCT] },
);

export async function getAllProductsWithTotalSold(): Promise<
  ServerActionResponse<ProductGetAllCounts[]>
> {
  return wrapServerCall(() => getAllProductsWithTotalSoldCached());
}

export type ProductQueryFilters = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest";
};

function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":  return { price: "asc" };
    case "price-desc": return { price: "desc" };
    case "name-asc":   return { name: "asc" };
    case "name-desc":  return { name: "desc" };
    default:           return { createdAt: "desc" };
  }
}

export async function getProductsByCategorySlug(
  categorySlug?: string,
  page = 1,
  pageSize = 12,
  filters: ProductQueryFilters = {},
): Promise<ServerActionResponse<{ products: SerializedProduct[]; total: number }>> {
  return wrapServerCall(async () => {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categorySlug ? { categories: { some: { slug: categorySlug } } } : {}),
      ...(filters.q ? {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
        ],
      } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined ? {
        price: {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
        },
      } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { categories: { select: { name: true, slug: true }, take: 1 } },
        orderBy: buildOrderBy(filters.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { products: products.map(serializeProduct) as SerializedProduct[], total };
  });
}

export async function getProductsByCollectionSlug(
  slug: string,
  page = 1,
  pageSize = 12,
  filters: ProductQueryFilters = {},
): Promise<ServerActionResponse<{ products: SerializedProduct[]; total: number }>> {
  return wrapServerCall(async () => {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      collections: { some: { slug } },
      ...(filters.q ? {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
        ],
      } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined ? {
        price: {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
        },
      } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: buildOrderBy(filters.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { products: products.map(serializeProduct) as SerializedProduct[], total };
  });
}

// === DYNAMIC PAGE QUERIES ===
export async function getProductById(
  id: string,
): Promise<
  ServerActionResponse<
    | (SerializedProduct & {
        categoryIds: string[];
        collections: { id: string; name: string }[];
        existingSizes: { label: string; inStock: boolean }[];
      })
    | null
  >
> {
  return wrapServerCall(async () => {
    const product = await prisma.product.findFirst({
      where: { id },
      include: {
        categories: {
          select: { id: true, name: true, slug: true },
        },
        collections: {
          select: { id: true, name: true },
        },
        sizes: {
          select: { label: true, stockTotal: true },
        },
      },
    });

    if (!product) return null;
    const serialized = serializeProduct(product) as SerializedProduct & { collections: { id: string; name: string }[] };
    return {
      ...serialized,
      categoryIds: product.categories.map((c) => c.id),
      // Availability model: stockTotal > 0 means the size is in stock.
      existingSizes: product.sizes.map((s) => ({
        label: s.label,
        inStock: s.stockTotal > 0,
      })),
    };
  });
}

const getProductBySlugCached = unstable_cache(
  async (slug: string) => {
    const product = await prisma.product.findFirst({
      where: { slug },
      include: {
        sizes: true,
        categories: { select: { name: true, slug: true } },
      },
    });

    if (!product) return null;

    const sizeOrder = product.sizeType
      ? SIZE_TEMPLATES[product.sizeType as keyof typeof SIZE_TEMPLATES]
      : SIZE_TEMPLATES[SIZE_TYPES.STANDARD];

    product.sizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a.label);
      const bIndex = sizeOrder.indexOf(b.label);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return {
      ...serializeProduct(product) as SerializedProduct,
      categories: product.categories,
      sizes: product.sizes.map((s) => ({
        ...s,
        stockTotal: s.stockTotal,
        stockReserved: s.stockReserved,
      })),
    };
  },
  [CACHE_TAG_PRODUCT, "by-slug"],
  { tags: [CACHE_TAG_PRODUCT] },
);

// Wrapped in React `cache()` so the duplicate calls from `generateMetadata`
// and the page body during a single render are de-duplicated into one lookup.
export const getProductBySlug = cache(async function getProductBySlug(
  slug: string,
): Promise<ServerActionResponse<ProductWithSizes | null>> {
  return wrapServerCall(() => getProductBySlugCached(slug));
});

export async function getDashboardProductStats(): Promise<
  ServerActionResponse<ProductDashboardStats>
> {
  return wrapServerCall(async () => {
    const [totalProducts, activeProducts, lowStockCount] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.size.count({
        where: {
          stockTotal: {
            lte: 5,
          },
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts: lowStockCount,
    };
  });
}

export async function getAdminProductById(
  id: string,
): Promise<
  ServerActionResponse<
    | (SerializedProduct & {
        sizes: Array<{
          id: string;
          label: string;
          stockTotal: number;
          stockReserved: number;
        }>;
        collections: { id: string; name: string }[];
      })
    | null
  >
> {
  return wrapServerCall(async () => {
    const product = await prisma.product.findFirst({
      where: { id },
      include: {
        categories: {
          select: { id: true, name: true, slug: true },
        },
        sizes: {
          select: { id: true, label: true, stockTotal: true, stockReserved: true },
        },
        collections: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) return null;
    return {
      ...serializeProduct(product) as SerializedProduct,
      sizes: product.sizes,
      collections: product.collections,
      categoryIds: product.categories.map((c) => c.id),
    };
  });
}
