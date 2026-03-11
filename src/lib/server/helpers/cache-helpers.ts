import { updateTag } from "next/cache";
import { invalidateTag as redisInvalidateTag } from "@/lib/redis-cache";

/**
 * Invalidate a cache tag in both Next.js (in-process) and Redis (distributed).
 *
 * Call this in server actions instead of plain `updateTag()` to ensure
 * Redis cache entries are also purged immediately.
 */
export async function invalidateCacheTag(tag: string): Promise<void> {
  updateTag(tag);
  // Redis invalidation is fire-and-forget — don't block the action
  redisInvalidateTag(tag).catch((err) =>
    console.error(`[Cache] Redis invalidation failed for tag "${tag}":`, err),
  );
}

/**
 * Invalidate multiple cache tags at once.
 */
export async function invalidateCacheTags(tags: string[]): Promise<void> {
  for (const tag of tags) {
    updateTag(tag);
  }
  Promise.all(tags.map(redisInvalidateTag)).catch((err) =>
    console.error("[Cache] Redis invalidation failed:", err),
  );
}
