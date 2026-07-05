import { redis, isRedisAvailable } from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds until the window resets
};

// === In-memory fallback limiter ===
// Used only when Redis is unavailable. Per-process (so weaker than the Redis
// limiter in a multi-instance deployment), but it still throttles brute-force
// attempts on each instance rather than failing fully open. Bounded in size to
// avoid unbounded memory growth from unique identifiers.
type MemoryEntry = { count: number; resetAt: number };
const memoryStore = new Map<string, MemoryEntry>();
const MEMORY_STORE_MAX_KEYS = 10_000;

function memoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    // Opportunistically evict expired / overflow keys to bound memory.
    if (memoryStore.size >= MEMORY_STORE_MAX_KEYS) {
      for (const [k, v] of memoryStore) {
        if (v.resetAt <= now) memoryStore.delete(k);
      }
      if (memoryStore.size >= MEMORY_STORE_MAX_KEYS) memoryStore.clear();
    }
    entry = { count: 0, resetAt: now + windowSeconds * 1000 };
    memoryStore.set(key, entry);
  }

  entry.count += 1;
  const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(limit - entry.count, 0),
    retryAfter,
  };
}

/**
 * Sliding-window rate limiter backed by Redis.
 *
 * Uses atomic INCR + EXPIRE to prevent race conditions.
 * Falls back to "always allow" when Redis is unavailable.
 *
 * @param identifier - Unique key (e.g. IP address, user ID)
 * @param limit - Max requests per window
 * @param windowSeconds - Window duration in seconds
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const r = redis;
  const available = r ? await isRedisAvailable() : false;
  if (!available || !r) {
    // Redis down/unconfigured — degrade to a per-instance in-memory limiter
    // instead of allowing every request through.
    return memoryRateLimit(identifier, limit, windowSeconds);
  }

  const key = `rl:${identifier}`;

  try {
    const pipeline = r.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      return memoryRateLimit(identifier, limit, windowSeconds);
    }

    const count = (results[0]?.[1] as number) ?? 1;
    const ttl = (results[1]?.[1] as number) ?? -1;

    // First request in window — set the expiry
    if (ttl === -1) {
      await r.expire(key, windowSeconds);
    }

    const remaining = Math.max(limit - count, 0);
    const retryAfter = ttl > 0 ? ttl : windowSeconds;

    return {
      allowed: count <= limit,
      remaining,
      retryAfter,
    };
  } catch {
    // Redis error mid-request — degrade to the in-memory limiter.
    return memoryRateLimit(identifier, limit, windowSeconds);
  }
}

// === Pre-configured limiters for common endpoints ===

/**
 * Login rate limit: 10 attempts per 15 minutes per IP.
 */
export function rateLimitLogin(ip: string) {
  return rateLimit(`login:${ip}`, 10, 900);
}

/**
 * Checkout rate limit: 5 attempts per minute per cart.
 */
export function rateLimitCheckout(cartId: string) {
  return rateLimit(`checkout:${cartId}`, 5, 60);
}

/**
 * API rate limit: 100 requests per minute per IP.
 */
export function rateLimitApi(ip: string) {
  return rateLimit(`api:${ip}`, 100, 60);
}

/**
 * Payment rate limit: 3 attempts per 5 minutes per order.
 */
export function rateLimitPayment(orderId: string) {
  return rateLimit(`payment:${orderId}`, 3, 300);
}

/**
 * Newsletter subscribe rate limit: 3 per hour per IP.
 */
export function rateLimitNewsletter(ip: string) {
  return rateLimit(`newsletter:${ip}`, 3, 3600);
}

/**
 * Coupon apply rate limit: 10 per minute per cart.
 */
export function rateLimitCoupon(cartId: string) {
  return rateLimit(`coupon:${cartId}`, 10, 60);
}

/**
 * Order-tracking lookup rate limit: 30 per minute per IP.
 * Tracking tokens are unguessable (32-char nanoid) but the endpoint returns
 * order PII, so we still throttle enumeration/abuse.
 */
export function rateLimitTracking(ip: string) {
  return rateLimit(`track:${ip}`, 30, 60);
}

/**
 * Transactional-email send rate limit: 10 per 10 minutes per order.
 * The order-confirmation / status-update senders are exposed server actions
 * that are also driven by the system (queue/ITN). This bounds abuse (an
 * attacker spamming a known order's customer) while comfortably clearing
 * legitimate usage (one confirmation + a few status updates, plus retries).
 */
export function rateLimitOrderEmail(orderId: string) {
  return rateLimit(`ordermail:${orderId}`, 10, 600);
}

/**
 * Newsletter unsubscribe rate limit: 20 per minute per IP.
 * Unsubscribe is intentionally public (email footer links carry no token), so
 * we throttle mass/abusive unsubscribes without impeding one-at-a-time admin
 * or customer use.
 */
export function rateLimitUnsubscribe(ip: string) {
  return rateLimit(`unsub:${ip}`, 20, 60);
}
