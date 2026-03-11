import { redis, isRedisAvailable } from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds until the window resets
};

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
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  const key = `rl:${identifier}`;

  try {
    const pipeline = r.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      return { allowed: true, remaining: limit, retryAfter: 0 };
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
    // Redis error — allow the request through
    return { allowed: true, remaining: limit, retryAfter: 0 };
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
