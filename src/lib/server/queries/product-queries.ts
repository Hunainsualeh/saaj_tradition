import { unstable_cache } from "next/cache";

import { OrderStatus } from "@prisma/client";
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
function serializeProduct<T extends { price: unknown; compareAtPrice?: unknown; categories?: unknown }>(product: T) {
  // `categories` is optional on the generic but we always want an array in the
  // serialized output that matches `SerializedProduct`.
  const base = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
  } as any;

  if (product.hasOwnProperty("categories")) {
    base.categories = (product as any).categories || [];
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
  return wrapServerCall(async () => {
    return await getThreeLatestProductsCached();
  });
}

// Featured products for home page new arrivals
const getFeaturedProductsCached = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { updatedAt: "desc" },
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
  return wrapServerCall(async () => {
    return await getFeaturedProductsCached();
  });
}

// Marquee products — by specific IDs or latest 12 active products as fallback
export async function getMarqueeProducts(
  ids: string[],
): Promise<ServerActionResponse<SerializedProduct[]>> {
  return wrapServerCall(async () => {
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
  });
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

const getThreeRandomProductsCache = unstable_cache(
  async (currentSlug: string) => {
    const products = await prisma.product.findMany({
      where: { isActive: true, slug: { not: currentSlug } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { categories: { select: { name: true, slug: true } } },
    });

    return products.map(serializeProduct) as SerializedProduct[];
  },
  [CACHE_TAG_PRODUCT, "random-three"],
  { tags: [CACHE_TAG_PRODUCT] },
);

export async function getThreeRandomProducts(
  id: string,
): Promise<ServerActionResponse<SerializedProduct[]>> {
  return wrapServerCall(async () => {
    return await getThreeRandomProductsCache(id);
  });
}
const getAllProductsWithTotalSoldCached = unstable_cache(
  async (): Promise<ProductGetAllCounts[]> => {
    const products = await prisma.product.findMany({
      include: {
        categories: {
          select: { name: true },
          take: 1,
        },
        cartItems: {
          include: {
            cart: {
              include: {
                order: {
                  select: {
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return products.map((product) => {
      // Sum up total sold from cart items where cart has an order that's not cancelled/refunded
      const totalSold = product.cartItems.reduce((sum, item) => {
        const order = item.cart.order;
        if (
          order &&
          order.status !== OrderStatus.CANCELLED &&
          order.status !== OrderStatus.REFUNDED
        ) {
          return sum + item.quantity;
        }
        return sum;
      }, 0);

      // Destructure to exclude cartItems (contains Decimal fields) from client payload
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cartItems: _cartItems, categories, ...productWithoutCartItems } = product;

      return {
        ...serializeProduct(productWithoutCartItems),
        categoryName: categories[0]?.name ?? "Uncategorized",
        totalSold,
      };
    });
  },
  [CACHE_TAG_PRODUCT, "total-sold"],
  { tags: [CACHE_TAG_PRODUCT] },
);

export async function getAllProductsWithTotalSold(): Promise<
  ServerActionResponse<ProductGetAllCounts[]>
> {
  return wrapServerCall(async () => {
    const products = await getAllProductsWithTotalSoldCached();

    return products;
  });
}

export async function getProductsByCategorySlug(
  categorySlug?: string,
  page = 1,
  pageSize = 12,
): Promise<ServerActionResponse<{ products: SerializedProduct[]; total: number }>> {
  return wrapServerCall(async () => {
    const where = categorySlug
      ? { categories: { some: { slug: categorySlug } }, isActive: true as const }
      : { isActive: true as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { categories: { select: { name: true, slug: true }, take: 1 } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ])

    return { products: products.map(serializeProduct) as SerializedProduct[], total };
  });
}

export async function getProductsByCollectionSlug(
  slug: string,
  page = 1,
  pageSize = 12,
): Promise<ServerActionResponse<{ products: SerializedProduct[]; total: number }>> {
  return wrapServerCall(async () => {
    const where = {
      isActive: true as const,
      collections: { some: { slug } },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
        collections: { id: string; name: string }[];
        existingSizeLabels: string[];
      })
    | null
  >
> {
  return wrapServerCall(async () => {
    const product = await prisma.product.findFirst({
      where: { id },
      include: {
        collections: {
          select: { id: true, name: true },
        },
        sizes: {
          select: { label: true },
        },
      },
    });

    if (!product) return null;
    const serialized = serializeProduct(product);
    return {
      ...serialized,
      existingSizeLabels: product.sizes.map((s) => s.label),
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
      ...serializeProduct(product),
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

export async function getProductBySlug(
  slug: string,
): Promise<ServerActionResponse<ProductWithSizes | null>> {
  return wrapServerCall(async () => getProductBySlugCached(slug));
}

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
      ...serializeProduct(product),
      categoryIds: product.categories.map((c) => c.id),
    };
  });
}
