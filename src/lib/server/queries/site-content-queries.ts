import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { SiteContentItem } from "@/types/client";
import { SiteContent } from "@prisma/client";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_SITE_CONTENT } from "@/lib/constants/cache-tags";

const getAllSiteContentCached = unstable_cache(
  async () =>
    prisma.siteContent.findMany({
      orderBy: { key: "asc" },
    }),
  [CACHE_TAG_SITE_CONTENT, "all"],
  { tags: [CACHE_TAG_SITE_CONTENT] },
);

// === FETCHES ===
export async function getAllSiteContent(): Promise<
  ServerActionResponse<SiteContentItem[]>
> {
  return wrapServerCall(() => getAllSiteContentCached());
}

export async function getSiteContentByKey(
  key: string,
): Promise<ServerActionResponse<SiteContent | null>> {
  return wrapServerCall(() =>
    prisma.siteContent.findUnique({
      where: { key },
    }),
  );
}

export async function getSiteContentById(
  id: string,
): Promise<ServerActionResponse<SiteContent | null>> {
  return wrapServerCall(() =>
    prisma.siteContent.findUnique({
      where: { id },
    }),
  );
}

const getSiteContentMapCached = unstable_cache(
  async () => {
    const items = await prisma.siteContent.findMany();
    return items.reduce(
      (acc, item) => {
        acc[item.key] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  },
  [CACHE_TAG_SITE_CONTENT, "map"],
  { tags: [CACHE_TAG_SITE_CONTENT] },
);

export async function getSiteContentMap(): Promise<
  ServerActionResponse<Record<string, string>>
> {
  return wrapServerCall(() => getSiteContentMapCached());
}
