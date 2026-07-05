import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { CollectionItem } from "@/types/client";
import { Collection } from "@prisma/client";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_COLLECTION } from "@/lib/constants/cache-tags";

// === FETCHES ===
const getCollectionsCached = unstable_cache(
  async () =>
    prisma.collection.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  [CACHE_TAG_COLLECTION, "all"],
  { tags: [CACHE_TAG_COLLECTION] },
);

export async function getCollections(): Promise<
  ServerActionResponse<CollectionItem[]>
> {
  return wrapServerCall(() => getCollectionsCached());
}

export async function getCollectionById(
  id: string,
): Promise<ServerActionResponse<Collection | null>> {
  return wrapServerCall(() =>
    prisma.collection.findUnique({
      where: { id },
    }),
  );
}
