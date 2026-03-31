"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { prisma } from "@/lib/prisma";
import { CollectionMutationInput, ServerActionResponse } from "@/types/server";
import { CACHE_TAG_COLLECTION } from "@/lib/constants/cache-tags";
import {
  AdminFormAddCollectionData,
  AdminFormEditCollectionData,
} from "@/components/admin/forms/AdminCollectionsForm/schema";
import { BLOB_STORAGE_PREFIXES } from "@/lib/constants";
import { adminRoutes, routes } from "@/lib/routing";
import { wrapServerCall } from "../helpers/generic-helpers";
import { requireAdmin } from "../helpers/require-admin";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { uploadToCloudinary } from "@/lib/server/helpers/cloudinary-upload";

// === MUTATIONS ===
export async function deleteCollectionById(
  id: string,
): Promise<ServerActionResponse<CollectionMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    const deleted = await prisma.collection.delete({ where: { id } });

    revalidatePath(adminRoutes.collections);
    revalidatePath(routes.home);
    invalidateCacheTag(CACHE_TAG_COLLECTION);

    return { id: deleted.id };
  });
}

export async function createCollection(
  data: AdminFormAddCollectionData,
): Promise<ServerActionResponse<CollectionMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id: `demo-${data.name.toLowerCase().replace(/\s+/g, "-")}` };
    }

    const imageFile = data.image;
    const imageFileName = BLOB_STORAGE_PREFIXES.COLLECTIONS + data.slug;

    const buffer = await imageFile.arrayBuffer();
    const imageUrl = await uploadToCloudinary(
      Buffer.from(buffer),
      imageFileName,
      "collections"
    );

    const maxOrder = await prisma.collection.aggregate({
      _max: { sortOrder: true },
    });

    const created = await prisma.collection.create({
      data: {
        name: data.name,
        tagline: data.tagline,
        imageUrl: imageUrl,
        slug: data.slug,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath(adminRoutes.collections);
    revalidatePath(routes.home);
    invalidateCacheTag(CACHE_TAG_COLLECTION);

    return { id: created.id };
  });
}

export async function updateCollectionById(
  id: string,
  data: AdminFormEditCollectionData,
): Promise<ServerActionResponse<CollectionMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    revalidatePath(adminRoutes.collections);
    revalidatePath(routes.home);
    invalidateCacheTag(CACHE_TAG_COLLECTION);

    if (data.image) {
      const imageFile = data.image;
      const imageFileName = BLOB_STORAGE_PREFIXES.COLLECTIONS + data.slug;

      const buffer = await imageFile.arrayBuffer();
      const imageUrl = await uploadToCloudinary(
        Buffer.from(buffer),
        imageFileName,
        "collections"
      );

      await prisma.collection.update({
        where: { id },
        data: {
          name: data.name,
          tagline: data.tagline,
          imageUrl: imageUrl,
          slug: data.slug,
          sortOrder: data.sortOrder,
        },
      });

      return { id };
    }

    await prisma.collection.update({
      where: { id },
      data: {
        name: data.name,
        tagline: data.tagline,
        slug: data.slug,
        sortOrder: data.sortOrder,
      },
    });
    return { id };
  });
}
