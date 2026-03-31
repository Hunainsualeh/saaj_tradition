"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { prisma } from "@/lib/prisma";
import { CategoryMutationInput, ServerActionResponse } from "@/types/server";
import { adminRoutes, routes } from "@/lib/routing";
import { CACHE_TAG_CATEGORY } from "@/lib/constants";
import { wrapServerCall } from "../helpers/generic-helpers";
import { requireAdmin } from "../helpers/require-admin";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { uploadToCloudinary } from "@/lib/server/helpers/cloudinary-upload";

type CategoryInput = {
  name: string;
  slug: string;
  tagline?: string;
  imageUrl?: string;
  image?: Blob;
};

// === MUTATIONS ===
export async function createCategory(
  data: CategoryInput,
): Promise<ServerActionResponse<CategoryMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id: `demo-${data.slug}` };
    }

    let resolvedImageUrl = data.imageUrl ?? "";

    if (data.image && data.image.size > 0) {
      const buffer = await data.image.arrayBuffer();
      resolvedImageUrl = await uploadToCloudinary(
        Buffer.from(buffer),
        data.slug,
        "categories",
      );
    }

    const maxOrder = await prisma.category.aggregate({
      _max: { sortOrder: true },
    });

    const created = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        tagline: data.tagline ?? "",
        imageUrl: resolvedImageUrl,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath(adminRoutes.categories);
    revalidatePath(routes.shop);
    invalidateCacheTag(CACHE_TAG_CATEGORY);

    return { id: created.id };
  });
}

export async function updateCategoryById(
  id: string,
  data: CategoryInput,
): Promise<ServerActionResponse<CategoryMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    let resolvedImageUrl = data.imageUrl ?? "";

    if (data.image && data.image.size > 0) {
      const buffer = await data.image.arrayBuffer();
      resolvedImageUrl = await uploadToCloudinary(
        Buffer.from(buffer),
        data.slug,
        "categories",
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        tagline: data.tagline ?? "",
        imageUrl: resolvedImageUrl,
      },
    });

    revalidatePath(adminRoutes.categories);
    revalidatePath(routes.shop);
    invalidateCacheTag(CACHE_TAG_CATEGORY);

    return { id: updated.id };
  });
}

export async function deleteCategoryById(
  id: string,
): Promise<ServerActionResponse<CategoryMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    // Before deleting, disconnect all products from this category (M2M)
    const productsInCategory = await prisma.product.findMany({
      where: { categories: { some: { id } } },
      select: { id: true },
    });
    if (productsInCategory.length > 0) {
      await prisma.category.update({
        where: { id },
        data: { products: { disconnect: productsInCategory.map((p) => ({ id: p.id })) } },
      });
    }

    const deleted = await prisma.category.delete({ where: { id } });

    revalidatePath(adminRoutes.categories);
    revalidatePath(routes.shop);
    invalidateCacheTag(CACHE_TAG_CATEGORY);

    return { id: deleted.id };
  });
}
