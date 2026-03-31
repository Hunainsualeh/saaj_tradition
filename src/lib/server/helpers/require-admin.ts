import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";

const ADMIN_COOKIE_NAME = "admin_session";

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.PAYFAST_SECURE_KEY ??
    "saaj-default-session-secret-change-me"
  );
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

  let payload: string;
  const verified = verifySession(token);
  if (verified) {
    payload = verified;
  } else {
    // Legacy fallback: accept raw base64 (will be re-signed on next login)
    payload = token;
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

  let payload: string;
  const verified = verifySession(decodeURIComponent(token));
  if (verified) {
    payload = verified;
  } else {
    // Legacy fallback
    payload = decodeURIComponent(token);
  }

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
