"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { prisma } from "@/lib/prisma";
import { AuthorMutationInput, ServerActionResponse } from "@/types/server";
import {
  AdminFormAddAuthorsData,
  AdminFormEditAuthorsData,
} from "@/components/admin/forms/AdminAuthorsForm/schema";
import { adminRoutes } from "@/lib/routing";
import { CACHE_TAG_AUTHOR } from "@/lib/constants/cache-tags";
import { wrapServerCall } from "../helpers/generic-helpers";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { requireAdmin } from "@/lib/server/helpers/require-admin";
import { uploadToCloudinary } from "@/lib/server/helpers/cloudinary-upload";

// === MUTATIONS ===
export async function deleteAuthorById(
  id: string,
): Promise<ServerActionResponse<AuthorMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    const deleted = await prisma.author.delete({ where: { id } });

    invalidateCacheTag(CACHE_TAG_AUTHOR);
    revalidatePath(adminRoutes.authors);
    revalidatePath(adminRoutes.blogsCreate);

    return { id: deleted.id };
  });
}

export async function createAuthor(
  data: AdminFormAddAuthorsData,
): Promise<ServerActionResponse<AuthorMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id: `demo-${data.name.toLowerCase().replace(/\s+/g, "-")}` };
    }

    const imageFile = data.image;
    const buffer = await imageFile.arrayBuffer();
    const avatarUrl = await uploadToCloudinary(
      Buffer.from(buffer),
      data.name,
      "authors",
    );

    const created = await prisma.author.create({
      data: {
        name: data.name,
        occupation: data.occupation,
        avatarUrl,
      },
    });

    invalidateCacheTag(CACHE_TAG_AUTHOR);
    revalidatePath(adminRoutes.authors);
    revalidatePath(adminRoutes.blogsCreate);

    return { id: created.id };
  });
}

export async function updateAuthorById(
  id: string,
  data: AdminFormEditAuthorsData,
): Promise<ServerActionResponse<AuthorMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    invalidateCacheTag(CACHE_TAG_AUTHOR);
    revalidatePath(adminRoutes.authors);
    revalidatePath(adminRoutes.blogs);
    revalidatePath(adminRoutes.blogsCreate);

    // If there's a new image, upload it and update the avatarUrl
    if (data.image) {
      const imageFile = data.image;
      const buffer = await imageFile.arrayBuffer();
      const avatarUrl = await uploadToCloudinary(
        Buffer.from(buffer),
        data.name,
        "authors",
      );

      await prisma.author.update({
        where: { id },
        data: {
          name: data.name,
          occupation: data.occupation,
          avatarUrl,
        },
      });

      return { id };
    }

    // If no new image, just update other fields
    await prisma.author.update({
      where: { id },
      data: {
        name: data.name,
        occupation: data.occupation,
      },
    });
    return { id };
  });
}
