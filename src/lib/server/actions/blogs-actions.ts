"use server";

import { BlogCategory } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { BlogMutationInput, ServerActionResponse } from "@/types/server";
import { getReadingMinutes, wrapServerCall } from "@/lib/server/helpers";
import { adminRoutes, routes } from "@/lib/routing";
import { CACHE_TAG_BLOG } from "@/lib/constants/cache-tags";
import {
  AdminFormAddBlogsData,
  AdminFormEditBlogsData,
} from "@/components/admin/forms/AdminBlogsForm/schema";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { uploadToCloudinary } from "@/lib/server/helpers/cloudinary-upload";

// === MUTATIONS ===
export async function createBlog(
  data: AdminFormAddBlogsData,
): Promise<ServerActionResponse<BlogMutationInput>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { id: `demo-${data.slug}` };
    }

    const imageFile = data.image;
    const buffer = await imageFile.arrayBuffer();
    const imageUrl = await uploadToCloudinary(
      Buffer.from(buffer),
      data.slug,
      "blogs",
    );

    const created = await prisma.blogPost.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category as BlogCategory,
        slug: data.slug,
        content: data.content,
        authorId: data.authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        duration: getReadingMinutes(data.content),
        blogImageUrl: imageUrl,
      },
    });

    updateTag(CACHE_TAG_BLOG);
    revalidatePath(adminRoutes.blogs);
    revalidatePath(routes.blog);
    revalidatePath(routes.home);

    return { id: created.id };
  });
}

export async function updateBlogById(
  id: string,
  data: AdminFormEditBlogsData,
): Promise<ServerActionResponse<BlogMutationInput>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { id };
    }

    updateTag(CACHE_TAG_BLOG);
    revalidatePath(adminRoutes.blogs);
    revalidatePath(routes.blog);
    revalidatePath(routes.home);

    if (data.image) {
      const imageFile = data.image;
      const buffer = await imageFile.arrayBuffer();
      const imageUrl = await uploadToCloudinary(
        Buffer.from(buffer),
        data.slug,
        "blogs",
      );

      const updated = await prisma.blogPost.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          category: data.category as BlogCategory,
          slug: data.slug,
          content: data.content,
          authorId: data.authorId,
          createdAt: new Date(),
          updatedAt: new Date(),
          duration: getReadingMinutes(data.content),
          blogImageUrl: imageUrl,
        },
      });

      return { id: updated.id };
    }

    // If no new image, just update other fields
    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category as BlogCategory,
        slug: data.slug,
        content: data.content,
        authorId: data.authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        duration: getReadingMinutes(data.content),
      },
    });
    return { id: updated.id };
  });
}

export async function deleteBlogById(
  id: string,
): Promise<ServerActionResponse<BlogMutationInput>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { id };
    }

    const deleted = await prisma.blogPost.delete({ where: { id } });
    updateTag(CACHE_TAG_BLOG);
    revalidatePath(adminRoutes.blogs);
    revalidatePath(routes.blog);
    revalidatePath(routes.home);

    return { id: deleted.id };
  });
}
