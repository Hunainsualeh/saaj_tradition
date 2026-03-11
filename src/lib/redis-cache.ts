import { redis, isRedisAvailable } from "@/lib/redis";

/** Default TTL for cached data (5 minutes) */
const DEFAULT_TTL = 300;

/** Safe getter — returns null when Redis is not configured */
function getRedis() {
  return redis;
}

/**
 * Redis-backed cache with tag-based invalidation.
 *
 * Falls back gracefully to direct DB calls when Redis is unavailable.
 * Works alongside Next.js `unstable_cache` — Redis serves as the first layer
 * to reduce database hits, while `unstable_cache` provides in-process caching.
 */

function buildKey(keyParts: string[]): string {
  return `cache:${keyParts.join(":")}`;
}

function buildTagSetKey(tag: string): string {
  return `cache-tag:${tag}`;
}

/**
 * Cache a function result in Redis with optional tag-based invalidation.
 *
 * @param fn - Async function whose result should be cached
 * @param keyParts - Array of strings forming the cache key
 * @param options.tags - Cache tags for invalidation
 * @param options.ttl - TTL in seconds (default: 300)
 */
export async function redisCache<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options?: { tags?: string[]; ttl?: number },
): Promise<T> {
  const r = getRedis();
  const available = r ? await isRedisAvailable() : false;
  if (!available || !r) return fn();

  const key = buildKey(keyParts);
  const ttl = options?.ttl ?? DEFAULT_TTL;

  try {
    const cached = await r.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Parsing error or connection hiccup — fall through to fetch fresh data
  }

  const data = await fn();

  try {
    const serialized = JSON.stringify(data);
    await r.setex(key, ttl, serialized);

    // Register key under each tag for invalidation
    if (options?.tags) {
      const pipeline = r.pipeline();
      for (const tag of options.tags) {
        pipeline.sadd(buildTagSetKey(tag), key);
      }
      await pipeline.exec();
    }
  } catch {
    // Non-critical — cache write failure shouldn't break the app
  }

  return data;
}

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
