import { redis, isRedisAvailable } from "@/lib/redis";

/** Safe getter — returns null when Redis is not configured */
function getRedis() {
  return redis;
}

function buildKey(keyParts: string[]): string {
  return `cache:${keyParts.join(":")}`;
}

function buildTagSetKey(tag: string): string {
  return `cache-tag:${tag}`;
}

// NOTE: Read caching is owned exclusively by the Next.js Data Cache via
// `unstable_cache` (every query wraps itself). A former `redisCache()` wrapper
// added a redundant second cache layer and was removed. Redis is still used
// below for tag-set bookkeeping, and elsewhere for rate limiting, the email
// queue, and admin session revocation.

/**
 * Invalidate all cache entries associated with a tag.
 * Call this whenever data changes (e.g. product update, order creation).
 */
export async function invalidateTag(tag: string): Promise<void> {
  const r = getRedis();
  if (!r || !(await isRedisAvailable())) return;

  try {
    const tagSetKey = buildTagSetKey(tag);
    const keys = await r.smembers(tagSetKey);

    if (keys.length > 0) {
      const pipeline = r.pipeline();
      for (const key of keys) {
        pipeline.del(key);
      }
      pipeline.del(tagSetKey);
      await pipeline.exec();
    }
  } catch {
    // Non-critical — tag invalidation failure is silent
  }
}

/**
 * Invalidate multiple tags at once.
 */
export async function invalidateTags(tags: string[]): Promise<void> {
  await Promise.all(tags.map(invalidateTag));
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateKey(keyParts: string[]): Promise<void> {
  const r = getRedis();
  if (!r || !(await isRedisAvailable())) return;

  try {
    await r.del(buildKey(keyParts));
  } catch {
    // Non-critical
  }
}

/**
 * Flush all cache entries (use sparingly — e.g. during deployments).
 */
export async function flushCache(): Promise<void> {
  const r = getRedis();
  if (!r || !(await isRedisAvailable())) return;

  try {
    // Only delete cache-related keys, not sessions or rate limits
    const keys = await r.keys("cache:*");
    const tagKeys = await r.keys("cache-tag:*");
    const allKeys = [...keys, ...tagKeys];
    if (allKeys.length > 0) {
      await r.del(...allKeys);
    }
  } catch {
    // Non-critical
  }
}
