import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.PAYFAST_SECURE_KEY ??
    "saaj-default-session-secret-change-me"
  );
}

/** Convert a string to an ArrayBuffer */
function strToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

/** Convert ArrayBuffer to hex string */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Convert hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Verify HMAC-signed session cookie using Web Crypto API (Edge-compatible) */
async function verifySignedSession(token: string): Promise<string | null> {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      strToBuffer(getSessionSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const expectedBuf = await crypto.subtle.sign("HMAC", key, strToBuffer(payload));
    const expected = bufToHex(expectedBuf);

    // Constant-time comparison
    const sigBytes = hexToBytes(sig);
    const expectedBytes = hexToBytes(expected);
    if (sigBytes.length !== expectedBytes.length) return null;

    let diff = 0;
    for (let i = 0; i < sigBytes.length; i++) {
      diff |= sigBytes[i] ^ expectedBytes[i];
    }
    if (diff !== 0) return null;
  } catch {
    return null;
  }

  return payload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except the login page itself)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminSession = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Try HMAC-signed cookie first, then fall back to legacy unsigned base64
    try {
      let payload: string;
      const verified = await verifySignedSession(adminSession);
      if (verified) {
        payload = verified;
      } else {
        // Legacy fallback: treat entire cookie as raw base64
        payload = adminSession;
      }

      const decoded = JSON.parse(atob(payload));
      if (!decoded.id || !decoded.role) {
        throw new Error("Invalid session");
      }
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
