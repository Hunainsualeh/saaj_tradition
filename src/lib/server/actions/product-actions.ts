"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { ProductMutationInput, ServerActionResponse } from "@/types/server";
import { adminRoutes } from "@/lib/routing";
import { wrapServerCall } from "../helpers/generic-helpers";
import {
  CACHE_TAG_PRODUCT,
  IN_STOCK_QTY,
  OUT_OF_STOCK_QTY,
  ONE_SIZE_LABEL,
} from "@/lib/constants";
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

    // Availability stock model: an in-stock size gets a high sentinel so cart
    // reservations never block a sale; an out-of-stock size gets 0.
    const sizes = data.sizes.map((size) => ({
      label: size.label,
      stockTotal: size.inStock ? IN_STOCK_QTY : OUT_OF_STOCK_QTY,
    }));

    // Derive the size type for display/sorting purposes only.
    const sizeType =
      data.sizes.length === 1 && data.sizes[0].label === ONE_SIZE_LABEL
        ? "OneSize"
        : "Standard";

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
        shippingCharge: data.shippingCharge != null ? new Decimal(data.shippingCharge) : null,
        images: data.imageUrls,
        sizeType,

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

    // === RECONCILE SIZES ===
    // Always sync the product's sizes to exactly what the admin selected:
    // remove deselected sizes, update availability on kept ones, add new ones.
    // (The old code only touched sizes when the size *type* changed, so size
    // edits silently did nothing.)
    const existingSizes = await prisma.size.findMany({
      where: { productId: id },
      select: { id: true, label: true },
    });
    const desiredLabels = new Set(
      data.sizes.map((s) => s.label.toLowerCase()),
    );
    const existingByLabel = new Map(
      existingSizes.map((s) => [s.label.toLowerCase(), s]),
    );

    const sizeIdsToDelete = existingSizes
      .filter((s) => !desiredLabels.has(s.label.toLowerCase()))
      .map((s) => s.id);

    const sizeUpdates: { where: { id: string }; data: { stockTotal: number } }[] = [];
    const sizeCreates: { label: string; stockTotal: number }[] = [];
    for (const size of data.sizes) {
      const stockTotal = size.inStock ? IN_STOCK_QTY : OUT_OF_STOCK_QTY;
      const existing = existingByLabel.get(size.label.toLowerCase());
      if (existing) {
        sizeUpdates.push({ where: { id: existing.id }, data: { stockTotal } });
      } else {
        sizeCreates.push({ label: size.label, stockTotal });
      }
    }

    const sizeType =
      data.sizes.length === 1 && data.sizes[0].label === ONE_SIZE_LABEL
        ? "OneSize"
        : "Standard";

    // Validate collection IDs exist before connecting to prevent P2025
    const safeCollectionIds = data.collectionIds?.length
      ? (
          await prisma.collection.findMany({
            where: { id: { in: data.collectionIds } },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: new Decimal(data.price),
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
        shippingCharge: data.shippingCharge != null ? new Decimal(data.shippingCharge) : null,
        images: data.imageUrls,
        sizeType,
        collections: {
          set: safeCollectionIds.map((cid) => ({ id: cid })),
        },
        sizes: {
          deleteMany: { id: { in: sizeIdsToDelete } },
          update: sizeUpdates,
          create: sizeCreates,
        },
      },
    });

    revalidatePath(adminRoutes.products);
    invalidateCacheTag(CACHE_TAG_PRODUCT);

    return { id: updated.id };
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
