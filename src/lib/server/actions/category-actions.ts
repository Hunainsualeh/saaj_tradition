"use server";

import { revalidatePath, updateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { CategoryMutationInput, ServerActionResponse } from "@/types/server";
import { adminRoutes, routes } from "@/lib/routing";
import { CACHE_TAG_CATEGORY } from "@/lib/constants";
import { wrapServerCall } from "../helpers/generic-helpers";
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
    updateTag(CACHE_TAG_CATEGORY);

    return { id: created.id };
  });
}

export async function updateCategoryById(
  id: string,
  data: CategoryInput,
): Promise<ServerActionResponse<CategoryMutationInput>> {
  return wrapServerCall(async () => {
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
    updateTag(CACHE_TAG_CATEGORY);

    return { id: updated.id };
  });
}

export async function deleteCategoryById(
  id: string,
): Promise<ServerActionResponse<CategoryMutationInput>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { id };
    }

    // Before deleting, unassign products from this category
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    const deleted = await prisma.category.delete({ where: { id } });

    revalidatePath(adminRoutes.categories);
    revalidatePath(routes.shop);
    updateTag(CACHE_TAG_CATEGORY);

    return { id: deleted.id };
  });
}
