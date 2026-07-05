import { revalidateTag } from "next/cache";
import { invalidateTag as redisInvalidateTag } from "@/lib/redis-cache";

export async function invalidateCacheTag(tag: string): Promise<void> {
  revalidateTag(tag, "max");
  redisInvalidateTag(tag).catch((err) =>
    console.error(`[Cache] Redis invalidation failed for tag "${tag}":`, err),
  );
}

export async function invalidateCacheTags(tags: string[]): Promise<void> {
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
  Promise.all(tags.map(redisInvalidateTag)).catch((err) =>
    console.error("[Cache] Redis invalidation failed:", err),
  );
}
