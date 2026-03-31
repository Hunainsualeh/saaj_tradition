"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { ProductMutationInput, ServerActionResponse } from "@/types/server";
import { adminRoutes } from "@/lib/routing";
import { wrapServerCall } from "../helpers/generic-helpers";
import { CACHE_TAG_PRODUCT, SIZE_TEMPLATES } from "@/lib/constants";
import { AdminProductsFormNoFileData } from "@/components/admin/forms/AdminProductsForm/schema";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { requireAdmin } from "@/lib/server/helpers/require-admin";

// === MUTATIONS ===
export async function createProduct(
  data: AdminProductsFormNoFileData,
): Promise<ServerActionResponse<ProductMutationInput>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    if (isDemoMode()) {
      return { id: `demo-${data.slug}` };
    }

    if (!data.sizeType) {
      throw new Error("sizeType is required");
    }

    // Use admin-selected sizes; fall back to full template if none specified
    const sizeLabels =
      data.selectedSizes?.length
        ? data.selectedSizes
        : SIZE_TEMPLATES[data.sizeType];

    const sizes = sizeLabels.map((size) => ({
      label: size,
      stockTotal: 10,
    }));

    // Validate collection IDs exist before connecting to prevent P2025
    const safeCollectionIds = data.collectionIds?.length
      ? (
          await prisma.collection.findMany({
            where: { id: { in: data.collectionIds } },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

    const created = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: new Decimal(data.price),
        compareAtPrice: data.compareAtPrice
          ? new Decimal(data.compareAtPrice)
          : null,
        ...(data.categoryIds?.length
          ? { categories: { connect: data.categoryIds.map((id) => ({ id })) } }
          : {}),
        slug: data.slug,
        isActive: data.isActive,
        isFeatured: data.isFeatured ?? false,
        stockStatus: data.stockStatus ?? "AVAILABLE",
        lowStockThreshold: data.lowStockThreshold ?? null,
        showLowStockWarning: data.showLowStockWarning ?? false,
        images: data.imageUrls,
        sizeType: data.sizeType,

        sizes: {
          create: sizes,
        },

        ...(safeCollectionIds.length
          ? { collections: { connect: safeCollectionIds.map((id) => ({ id })) } }
          : {}),
      },
    });

    revalidatePath(adminRoutes.products);
    invalidateCacheTag(CACHE_TAG_PRODUCT);

    return { id: created.id };
  });
}

export async function updateProductById(
  id: string,
  data: AdminProductsFormNoFileData,
): Promise<ServerActionResponse<ProductMutationInput>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    // Check if sizeType has changed so we can recreate sizes
    const current = data.sizeType
      ? await prisma.product.findUnique({ where: { id }, select: { sizeType: true } })
      : null;
    const sizeTypeChanged = current && current.sizeType !== data.sizeType;

    // Validate collection IDs exist before connecting to prevent P2025
    const safeCollectionIds = data.collectionIds?.length
      ? (
          await prisma.collection.findMany({
            where: { id: { in: data.collectionIds } },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

    const created = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice
          ? new Decimal(data.compareAtPrice)
          : null,
        categories: {
          set: (data.categoryIds ?? []).map((id) => ({ id })),
        },
        slug: data.slug,
        isActive: data.isActive,
        isFeatured: data.isFeatured ?? false,
        stockStatus: data.stockStatus ?? "AVAILABLE",
        lowStockThreshold: data.lowStockThreshold ?? null,
        showLowStockWarning: data.showLowStockWarning ?? false,
        images: data.imageUrls,
        sizeType: data.sizeType,
        collections: {
          set: safeCollectionIds.map((cid) => ({ id: cid })),
        },
        ...(sizeTypeChanged && data.sizeType
          ? {
              sizes: {
                deleteMany: {},
                create: (data.selectedSizes?.length
                  ? data.selectedSizes
                  : SIZE_TEMPLATES[data.sizeType]
                ).map((label) => ({
                  label,
                  stockTotal: 10,
                })),
              },
            }
          : {}),
      },
    });

    revalidatePath(adminRoutes.products);
    invalidateCacheTag(CACHE_TAG_PRODUCT);

    return { id: created.id };
  });
}

export async function deleteProductById(
  id: string,
): Promise<ServerActionResponse<ProductMutationInput>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    const deleted = await prisma.product.delete({ where: { id } });

    revalidatePath(adminRoutes.products);
    invalidateCacheTag(CACHE_TAG_PRODUCT);

    return { id: deleted.id };
  });
}

/** Delete multiple products by their IDs */
export async function deleteProductsByIds(
  ids: string[],
): Promise<ServerActionResponse<{ count: number }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    if (isDemoMode()) {
      return { count: ids.length };
    }

    const result = await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    revalidatePath(adminRoutes.products);
    invalidateCacheTag(CACHE_TAG_PRODUCT);

    return { count: result.count };
  });
}

/** Toggle the isFeatured flag on a product */
export async function toggleProductFeatured(
  id: string,
): Promise<ServerActionResponse<{ id: string; isFeatured: boolean }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    if (isDemoMode()) {
      return { id, isFeatured: false };
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");

    const updated = await prisma.product.update({
      where: { id },
      data: { isFeatured: !product.isFeatured },
    });

    revalidatePath(adminRoutes.products);
    invalidateCacheTag(CACHE_TAG_PRODUCT);

    return { id: updated.id, isFeatured: updated.isFeatured };
  });
}
