/**
 * Custom next/image loader.
 *
 * Almost every dynamic image on the storefront (products, categories,
 * collections, blogs, team, testimonials) is stored as a Cloudinary URL. With
 * the DEFAULT loader, next/image re-proxies each one through the Vercel Image
 * Optimization API — Cloudinary → Vercel → browser — which means:
 *   1. a second, cold image transform on every unique width, and
 *   2. consumption of Vercel's monthly image-optimization quota. On the Hobby
 *      plan that quota is small, and once it is exhausted product images stop
 *      being optimized and render inconsistently (the exact symptom reported in
 *      production).
 *
 * This loader instead rewrites Cloudinary sources to Cloudinary delivery URLs
 * with a responsive width and automatic format/quality, served straight from
 * Cloudinary's global CDN — no Vercel optimizer, no quota, no double transform.
 *
 * NOTE: this file runs on both the server and the client, so it must stay pure
 * string manipulation with no Node/browser-only APIs.
 */

import { OPTIMIZED_ASSET_WIDTHS, OPTIMIZED_ASSETS } from "./optimized-assets";

type ImageLoaderArgs = {
  src: string;
  width: number;
  // Cloudinary images default to q_auto. Focal images (hero, main product
  // photo) can opt into a fixed high quality by passing next/image `quality`
  // >= 80 — see the quality handling below. Local images are served as-is.
  quality?: number;
};

// Widths Cloudinary is allowed to generate. Mirrors next/image's device/image
// sizes so we never request an oddball width; also caps upscaling requests.
const MAX_CLOUDINARY_WIDTH = 3840;

export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderArgs): string {
  // --- Cloudinary: deliver straight from Cloudinary's CDN ---
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const w = Math.min(width, MAX_CLOUDINARY_WIDTH);
    // c_limit: scale down to the requested width, never upscale past the source.
    // f_auto:  serve AVIF/WebP based on the requesting browser.
    // Quality: q_auto (smallest bytes at good perceptual quality) is right for
    // the many secondary images. Focal images opt into a fixed high quality by
    // passing `quality` >= 80; they also get a light sharpen (e_sharpen:60) to
    // counter the softness that full-bleed downscaling introduces — this is
    // what makes a large hero look "dull" — while staying AVIF/WebP + capped.
    const q =
      quality && quality >= 80 ? `q_${quality},e_sharpen:60` : "q_auto";
    const params = `f_auto,${q},c_limit,w_${w}`;

    // Stored URLs often bake in a transformation right after `/upload/`
    // (e.g. `f_auto,q_auto:best` — the largest quality tier, at full size).
    // If we merely chained ours on, that baked-in quality would override us and
    // keep the payload oversized. So strip a leading transformation segment and
    // substitute our responsive one. A Cloudinary version (`v123…`) or a folder
    // segment never matches these transform-token prefixes, so they are kept.
    const [prefix, rest] = src.split("/upload/");
    const segments = rest.split("/");
    const looksLikeTransform =
      /(^|,)(f_|q_|w_|h_|c_|e_|dpr_|g_|b_|fl_|ar_|o_|r_)/.test(segments[0]);
    const tail = looksLikeTransform ? segments.slice(1).join("/") : rest;

    return `${prefix}/upload/${params}/${tail}`;
  }

  const localMatch = src.match(/^\/assets\/([^?#]+)$/);
  if (localMatch) {
    const rel = decodeURI(localMatch[1]);
    if (OPTIMIZED_ASSETS.has(rel)) {
      const target =
        OPTIMIZED_ASSET_WIDTHS.find((w) => w >= width) ??
        OPTIMIZED_ASSET_WIDTHS[OPTIMIZED_ASSET_WIDTHS.length - 1];
      const base = rel.replace(/\.[^.]+$/, "");
      return encodeURI(`/assets/opt/${base}-${target}.webp`);
    }
  }

  return src.startsWith("/") ? encodeURI(src) : src;
}
