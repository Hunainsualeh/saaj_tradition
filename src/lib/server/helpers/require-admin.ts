import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";
import { isTokenDenylisted } from "@/lib/redis-session";

const ADMIN_COOKIE_NAME = "admin_session";

/** Throws at call time if ADMIN_SESSION_SECRET is missing or still set to the insecure default. */
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET env var is required but not set.");
  }
  if (secret === "saaj-default-session-secret-change-me") {
    throw new Error("ADMIN_SESSION_SECRET must be changed from the default value.");
  }
  return secret;
}

/** Verify HMAC-signed session token and return the base64 payload, or null */
function verifySession(token: string): string | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  const expected = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  return payload;
}

export type AdminSession = {
  id: string;
  role: string;
};

/**
 * Verify the admin session cookie (HMAC-signed) and return the admin session.
 * Throws "Unauthorized" if the cookie is missing, invalid, or the admin is
 * deactivated — so callers wrapped in `wrapServerCall` will return a clean
 * `{ success: false, error: "Unauthorized" }` response.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = verifySession(token);
  if (!payload) {
    // Cookie present but signature invalid — reject with no fallback
    throw new Error("Unauthorized");
  }

  // Reject cookies explicitly revoked at logout (best-effort; fail-open).
  if (await isTokenDenylisted(token)) {
    throw new Error("Unauthorized");
  }

  let decoded: { id?: string; role?: string };
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
  } catch {
    throw new Error("Unauthorized");
  }

  if (!decoded.id || !decoded.role) {
    throw new Error("Unauthorized");
  }

  // Verify admin still exists and is active in the DB
  const admin = await prisma.adminUser.findUnique({
    where: { id: decoded.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    throw new Error("Unauthorized");
  }

  return { id: admin.id, role: admin.role };
}

/**
 * Verify admin session from a raw cookie header string (for API Route Handlers
 * where `cookies()` from next/headers is not available or we need to parse
 * manually from the request).
 *
 * Returns the admin session or null if invalid.
 */
export async function verifyAdminFromRequest(
  cookieHeader: string,
): Promise<AdminSession | null> {
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`),
  );
  const token = match?.[1];
  if (!token) return null;

  const decodedToken = decodeURIComponent(token);
  const payload = verifySession(decodedToken);
  if (!payload) return null;

  if (await isTokenDenylisted(decodedToken)) return null;

  let decoded: { id?: string; role?: string };
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
  } catch {
    return null;
  }

  if (!decoded.id || !decoded.role) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: decoded.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) return null;

  return { id: admin.id, role: admin.role };
}
