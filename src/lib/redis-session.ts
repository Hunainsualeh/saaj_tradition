import { redis, isRedisAvailable } from "@/lib/redis";

const SESSION_PREFIX = "session:";
const DEFAULT_SESSION_TTL = 60 * 60 * 24; // 24 hours

function r() { return redis; }

export type SessionData = {
  id: string;
  role: string;
  [key: string]: unknown;
};

/**
 * Store an admin session in Redis.
 */
export async function createSession(
  sessionId: string,
  data: SessionData,
  ttlSeconds = DEFAULT_SESSION_TTL,
): Promise<void> {
  const available = await isRedisAvailable();
  if (!available || !r()) return;

  try {
    await r()!.setex(
      `${SESSION_PREFIX}${sessionId}`,
      ttlSeconds,
      JSON.stringify(data),
    );
  } catch (error) {
    console.error("[Session] Failed to create session:", error);
  }
}

/**
 * Retrieve an admin session from Redis.
 */
export async function getSession(
  sessionId: string,
): Promise<SessionData | null> {
  const available = await isRedisAvailable();
  if (!available || !r()) return null;

  try {
    const raw = await r()!.get(`${SESSION_PREFIX}${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Delete an admin session from Redis.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const available = await isRedisAvailable();
  if (!available || !r()) return;

  try {
    await r()!.del(`${SESSION_PREFIX}${sessionId}`);
  } catch {
    // Non-critical
  }
}

/**
 * Extend session TTL (touch on activity).
 */
export async function touchSession(
  sessionId: string,
  ttlSeconds = DEFAULT_SESSION_TTL,
): Promise<void> {
  const available = await isRedisAvailable();
  if (!available || !r()) return;

  try {
    await r()!.expire(`${SESSION_PREFIX}${sessionId}`, ttlSeconds);
  } catch {
    // Non-critical
  }
}

/**
 * Get all active session keys (for admin monitoring).
 */
export async function getActiveSessionCount(): Promise<number> {
  const available = await isRedisAvailable();
  if (!available || !r()) return 0;

  try {
    const keys = await r()!.keys(`${SESSION_PREFIX}*`);
    return keys.length;
  } catch {
    return 0;
  }
}
