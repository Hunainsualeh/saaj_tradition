import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

const globalForRedis = globalThis as unknown as {
  redis?: Redis | null;
  redisLogged?: boolean;
};

function createRedisClient(): Redis | null {
  if (!REDIS_URL) {
    // Redis backs rate limiting (brute-force protection) and admin session
    // revocation. Both have SAFE fallbacks: rate limiting degrades to a
    // per-instance in-memory limiter (see rate-limit.ts), and session
    // revocation fails open (see redis-session.ts). A missing or unreachable
    // Redis must therefore DEGRADE the site, never take it down.
    //
    // This code runs at module-evaluation time, so throwing here would 500
    // every route that transitively imports Redis (the whole storefront) and
    // even crash the serverless function — a catastrophic failure mode for a
    // non-fatal, recoverable condition. So in production we log LOUDLY (so the
    // misconfiguration is visible in the platform logs) but return null and let
    // the fallbacks take over. Set REDIS_URL to restore full protection.
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_NO_REDIS !== "true" &&
      !isBuildPhase
    ) {
      console.error(
        "[Redis] REDIS_URL is not set in production — running DEGRADED: rate " +
          "limiting is now per-instance (in-memory) and admin session " +
          "revocation is disabled. Set REDIS_URL to restore full protection.",
      );
    }
    return null;
  }

  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        if (!globalForRedis.redisLogged) {
          console.warn("[Redis] Unreachable after 3 retries — giving up");
          globalForRedis.redisLogged = true;
        }
        return null; // stop retrying
      }
      return Math.min(times * 500, 3000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 5000,
  });

  let errorLogged = false;
  client.on("error", () => {
    if (!errorLogged) {
      console.warn("[Redis] Connection failed — falling back to direct DB");
      errorLogged = true;
    }
  });

  client.on("connect", () => {
    errorLogged = false; // reset so we log if it disconnects again later
    console.info("[Redis] Connected");
  });

  return client;
}

// Singleton: reuse across hot-reloads in development
export const redis: Redis | null =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : createRedisClient();
// Singleton: reuse across hot-reloads in development and across
// invocations in serverless (Vercel) production environments.
globalForRedis.redis = redis;

/**
 * Returns true when the Redis connection is alive.
 * Safe to call from anywhere – never throws.
 * Caches result for 30s to avoid hammering a down server.
 */
let _available: boolean | null = null;
let _checkedAt = 0;
const CHECK_INTERVAL = 30_000; // re-check every 30s

export async function isRedisAvailable(): Promise<boolean> {
  if (!redis) return false;

  const now = Date.now();
  if (_available !== null && now - _checkedAt < CHECK_INTERVAL) {
    return _available;
  }

  try {
    if (redis.status === "wait") await redis.connect();
    const pong = await redis.ping();
    _available = pong === "PONG";
  } catch {
    _available = false;
  }
  _checkedAt = now;
  return _available;
}
