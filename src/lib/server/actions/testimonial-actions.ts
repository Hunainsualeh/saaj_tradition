"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { prisma } from "@/lib/prisma";
import { TestimonialMutationInput, ServerActionResponse } from "@/types/server";
import { CACHE_TAG_TESTIMONIAL } from "@/lib/constants/cache-tags";
import {
  AdminFormAddTestimonialData,
  AdminFormEditTestimonialData,
} from "@/components/admin/forms/AdminTestimonialsForm/schema";
import { adminRoutes, routes } from "@/lib/routing";
import { wrapServerCall } from "../helpers/generic-helpers";
import { requireAdmin } from "../helpers/require-admin";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { uploadToCloudinary } from "@/lib/server/helpers/cloudinary-upload";

export async function deleteTestimonialById(
  id: string,
): Promise<ServerActionResponse<TestimonialMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }
    const deleted = await prisma.testimonial.delete({ where: { id } });
    revalidatePath(adminRoutes.testimonials);
    revalidatePath(routes.home);
    invalidateCacheTag(CACHE_TAG_TESTIMONIAL);
    return { id: deleted.id };
  });
}

export async function createTestimonial(
  data: AdminFormAddTestimonialData,
): Promise<ServerActionResponse<TestimonialMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id: `demo-${data.name.toLowerCase().replace(/\s+/g, "-")}` };
    }

    let imageSrc: string | null = null;
    if (data.image) {
      const buffer = await data.image.arrayBuffer();
      imageSrc = await uploadToCloudinary(
        Buffer.from(buffer),
        data.name.toLowerCase().replace(/\s+/g, "-"),
        "testimonials",
      );
    }

    const maxOrder = await prisma.testimonial.aggregate({
      _max: { sortOrder: true },
    });
    const created = await prisma.testimonial.create({
      data: {
        name: data.name,
        text: data.text,
        rating: data.rating,
        imageSrc,
        isActive: data.isActive,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    revalidatePath(adminRoutes.testimonials);
    revalidatePath(routes.home);
    invalidateCacheTag(CACHE_TAG_TESTIMONIAL);
    return { id: created.id };
  });
}

export async function updateTestimonialById(
  id: string,
  data: AdminFormEditTestimonialData,
): Promise<ServerActionResponse<TestimonialMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    const updateData: Record<string, unknown> = {
      name: data.name,
      text: data.text,
      rating: data.rating,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    };

    if (data.image) {
      const buffer = await data.image.arrayBuffer();
      updateData.imageSrc = await uploadToCloudinary(
        Buffer.from(buffer),
        data.name.toLowerCase().replace(/\s+/g, "-"),
        "testimonials",
      );
    }

    await prisma.testimonial.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(adminRoutes.testimonials);
    revalidatePath(routes.home);
    invalidateCacheTag(CACHE_TAG_TESTIMONIAL);
    return { id };
  });
}
