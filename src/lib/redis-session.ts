import { createHash } from "crypto";

import { redis, isRedisAvailable } from "@/lib/redis";

const SESSION_PREFIX = "session:";
const DENYLIST_PREFIX = "denylist:";
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

// === Token denylist (explicit revocation) ===
// Lets logout invalidate a specific signed cookie for its remaining lifetime,
// so a copied/stolen cookie can't be replayed after the user signs out. We
// store only a SHA-256 hash of the token, never the token itself. Fail-OPEN
// (absence of Redis or a missing entry = not revoked) so this can never lock a
// legitimate admin out.

function tokenKey(token: string): string {
  return `${DENYLIST_PREFIX}${createHash("sha256").update(token).digest("hex")}`;
}

export async function denylistToken(
  token: string,
  ttlSeconds: number,
): Promise<void> {
  if (ttlSeconds <= 0) return;
  const available = await isRedisAvailable();
  if (!available || !r()) return;
  try {
    await r()!.setex(tokenKey(token), Math.ceil(ttlSeconds), "1");
  } catch (error) {
    console.error("[Session] Failed to denylist token:", error);
  }
}

export async function isTokenDenylisted(token: string): Promise<boolean> {
  const available = await isRedisAvailable();
  if (!available || !r()) return false; // fail-open — never lock admins out
  try {
    return (await r()!.exists(tokenKey(token))) === 1;
  } catch {
    return false;
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
