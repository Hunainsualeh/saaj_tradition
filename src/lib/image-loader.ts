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
 * Local `/assets/*` marketing images (heroes, posters — a handful, already
 * hand-compressed) keep using Next's built-in optimizer so they still get
 * responsive AVIF/WebP. Any legacy Vercel-Blob images route through it too.
 *
 * NOTE: this file runs on both the server and the client, so it must stay pure
 * string manipulation with no Node/browser-only APIs.
 */

type ImageLoaderArgs = {
  src: string;
  width: number;
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
    // q_auto:  let Cloudinary pick the smallest bytes at good perceptual quality.
    const params = `f_auto,q_auto,c_limit,w_${w}`;

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

  // --- Everything else (local /assets, legacy Vercel Blob) ---
  // Route through Next's built-in optimizer so these still get responsive,
  // modern-format delivery. `/_next/image` is Next's default optimizer path.
  const q = quality || 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
