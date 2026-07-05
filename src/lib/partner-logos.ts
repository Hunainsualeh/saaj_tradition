/**
 * Partner-logo entries power the "Our Partners" marquee on the home page and are
 * edited from the admin Site Content / Marquee screens. Each entry can carry a
 * partner name (text), a logo image (uploaded path or external URL), or both.
 *
 * Storage lives in a single `partners_logos` SiteContent row. To stay backward
 * compatible with the original format — a newline-separated list of plain partner
 * names — the value is parsed leniently:
 *   • New format  → a JSON array of `{ name?, image? }` objects.
 *   • Legacy format → one partner name per line.
 */

export type PartnerLogo = {
  /** Partner name / text label (optional). */
  name?: string;
  /** Logo image source — an uploaded Cloudinary path or an external URL (optional). */
  image?: string;
};

/** Default partners used before the admin customises the list. */
export const DEFAULT_PARTNER_LOGOS_RAW =
  "LVMH\nKERING\nRICHEMONT\nCAPRI\nTAPESTRY\nPRADA GROUP";

function normalizeEntry(entry: unknown): PartnerLogo | null {
  if (typeof entry === "string") {
    const name = entry.trim();
    return name ? { name } : null;
  }
  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    const image = typeof obj.image === "string" ? obj.image.trim() : "";
    if (!name && !image) return null;
    return {
      ...(name ? { name } : {}),
      ...(image ? { image } : {}),
    };
  }
  return null;
}

/**
 * Parse a stored `partners_logos` value into structured entries. Accepts both the
 * new JSON format and the legacy newline-separated list of names.
 */
export function parsePartnerLogos(
  raw: string | null | undefined,
): PartnerLogo[] {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeEntry)
          .filter((e): e is PartnerLogo => e !== null);
      }
    } catch {
      // Malformed JSON — fall through to legacy line parsing.
    }
  }

  return trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

/**
 * Serialize structured entries back to the stored string format. Empty entries
 * (no name and no image) are dropped.
 */
export function serializePartnerLogos(logos: PartnerLogo[]): string {
  const cleaned = logos
    .map((logo): PartnerLogo => {
      const name = logo.name?.trim() ?? "";
      const image = logo.image?.trim() ?? "";
      return {
        ...(name ? { name } : {}),
        ...(image ? { image } : {}),
      };
    })
    .filter((logo) => logo.name || logo.image);

  return JSON.stringify(cleaned);
}
