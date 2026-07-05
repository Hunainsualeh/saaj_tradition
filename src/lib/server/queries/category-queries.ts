import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { Category } from "@prisma/client";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_CATEGORY } from "@/lib/constants/cache-tags";

// === FETCHES ===
const getAllCategoriesCached = unstable_cache(
  async () =>
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  [CACHE_TAG_CATEGORY, "all"],
  { tags: [CACHE_TAG_CATEGORY] },
);

export async function getAllCategories(): Promise<
  ServerActionResponse<Category[]>
> {
  return wrapServerCall(() => getAllCategoriesCached());
}

export async function getCategoryById(
  id: string,
): Promise<ServerActionResponse<Category | null>> {
  return wrapServerCall(() =>
    prisma.category.findUnique({
      where: { id },
    }),
  );
}

export async function getCategoryBySlug(
  slug: string,
): Promise<ServerActionResponse<Category | null>> {
  return wrapServerCall(() =>
    prisma.category.findUnique({
      where: { slug },
    }),
  );
}
