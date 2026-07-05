import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

const globalForRedis = globalThis as unknown as {
  redis?: Redis | null;
  redisLogged?: boolean;
};

function createRedisClient(): Redis | null {
  if (!REDIS_URL) {
    // Redis is REQUIRED in production: it backs rate limiting (brute-force
    // protection), the durable email queue, and admin session revocation.
    // Running production without it silently disables those guarantees, so we
    // fail fast at boot instead. In dev/test we allow the graceful fallback.
    //
    // IMPORTANT: skip this throw during `next build`. Next.js evaluates route
    // modules while "collecting page data" with NODE_ENV=production but WITHOUT
    // runtime secrets (REDIS_URL is typically injected at runtime, not build
    // time — e.g. Docker/CI). Throwing here would break the production build.
    // The guard still fires at runtime (serverless cold start / `next start`),
    // which is where we actually want to fail fast.
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_NO_REDIS !== "true" &&
      !isBuildPhase
    ) {
      throw new Error(
        "REDIS_URL is required in production (rate limiting, email queue, session revocation). " +
          "Set REDIS_URL, or explicitly opt out with ALLOW_NO_REDIS=true.",
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
