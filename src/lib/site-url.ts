/**
 * Canonical, absolute site URL for every customer-facing link the backend
 * generates: order-confirmation / status emails, the "Track My Order" button,
 * newsletter & promotional broadcasts, PayFast return/notify callbacks, the
 * sitemap and page metadata.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL — explicit override.
 *        • Local dev  → set to http://localhost:3000 (in .env).
 *        • Production → set to https://saajtradition.com (in the Vercel
 *          dashboard, "Production" environment).
 *   2. Production default → https://saajtradition.com.
 *
 * Hard guarantee: a localhost value is honoured ONLY outside production. If a
 * stale `NEXT_PUBLIC_SITE_URL=http://localhost:3000` is ever left in the
 * production environment, we still emit the real domain — a localhost link can
 * never reach a real customer's inbox.
 */
export const PRODUCTION_SITE_URL = "https://saajtradition.com";

function normalize(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isLocalhost(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url);
}

/** Resolve the canonical site origin (no trailing slash). */
export function getSiteUrl(): string {
  const isProd = process.env.NODE_ENV === "production";

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const url = normalize(explicit);
    if (isLocalhost(url)) {
      // Never leak a localhost link into a production email / callback.
      return isProd ? PRODUCTION_SITE_URL : url;
    }
    return url;
  }

  return isProd ? PRODUCTION_SITE_URL : "http://localhost:3000";
}
