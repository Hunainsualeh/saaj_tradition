import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { AuthorWithPostCount } from "@/types/client";
import { Author } from "@prisma/client";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_AUTHOR } from "@/lib/constants/cache-tags";

// === FETCHES ===
const getAuthorsCached = unstable_cache(
  async () =>
    prisma.author.findMany({
      include: { _count: { select: { posts: true } } },
    }),
  [CACHE_TAG_AUTHOR, "all"],
  { tags: [CACHE_TAG_AUTHOR] },
);

export async function getAuthors(): Promise<
  ServerActionResponse<AuthorWithPostCount[]>
> {
  return wrapServerCall(() => getAuthorsCached());
}

export async function getAuthorById(
  id: string,
): Promise<ServerActionResponse<Author | null>> {
  return wrapServerCall(() =>
    prisma.author.findUnique({
      where: { id },
    }),
  );
}
