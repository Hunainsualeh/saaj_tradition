"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { prisma } from "@/lib/prisma";
import { SiteContentMutationInput, ServerActionResponse } from "@/types/server";
import { CACHE_TAG_SITE_CONTENT } from "@/lib/constants/cache-tags";
import { adminRoutes, routes } from "@/lib/routing";
import { wrapServerCall } from "../helpers/generic-helpers";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";

// === MUTATIONS ===
export async function upsertSiteContent(
  key: string,
  value: string,
  label: string,
  group: string = "general",
): Promise<ServerActionResponse<SiteContentMutationInput>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { id: `demo-${key}` };
    }

    const result = await prisma.siteContent.upsert({
      where: { key },
      update: { value, label, group },
      create: { key, value, label, group },
    });

    revalidatePath(adminRoutes.siteContent);
    revalidatePath(routes.home);
    revalidatePath(routes.about);
    invalidateCacheTag(CACHE_TAG_SITE_CONTENT);

    return { id: result.id };
  });
}

export async function updateSiteContentById(
  id: string,
  value: string,
): Promise<ServerActionResponse<SiteContentMutationInput>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { id };
    }

    await prisma.siteContent.update({
      where: { id },
      data: { value },
    });

    revalidatePath(adminRoutes.siteContent);
    revalidatePath(routes.home);
    revalidatePath(routes.about);
    invalidateCacheTag(CACHE_TAG_SITE_CONTENT);

    return { id };
  });
}

export async function bulkUpdateSiteContent(
  items: { id: string; value: string }[],
): Promise<ServerActionResponse<{ count: number }>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { count: items.length };
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.siteContent.update({
          where: { id: item.id },
          data: { value: item.value },
        }),
      ),
    );

    revalidatePath(adminRoutes.siteContent);
    revalidatePath(routes.home);
    revalidatePath(routes.about);
    invalidateCacheTag(CACHE_TAG_SITE_CONTENT);

    return { count: items.length };
  });
}

export async function deleteSiteContentById(
  id: string,
): Promise<ServerActionResponse<{ id: string }>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) {
      return { id };
    }

    await prisma.siteContent.delete({ where: { id } });

    revalidatePath(adminRoutes.siteContent);
    revalidatePath(routes.home);
    revalidatePath(routes.about);
    invalidateCacheTag(CACHE_TAG_SITE_CONTENT);

    return { id };
  });
}
