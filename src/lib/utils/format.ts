/**
 * Formats a date to "4 Mar, 2025" format
 */

export function formatBlogDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

/*
 * Formats a date to "YYYY-MM-DD" format
 */

export function formatDateToYYYYMMDD(
  date: Date | string | null,
): string | null {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Deterministic date/time formatting for admin views. A fixed locale + explicit
 * options + a fixed timezone (the store operates in PKT) guarantee the server
 * and client render identical strings, preventing hydration mismatches that
 * occur when a runtime's default locale/timezone differs.
 */
const ADMIN_TZ = "Asia/Karachi";

export function formatAdminDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    timeZone: ADMIN_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAdminDateTime(date: Date | string): string {
  const d = new Date(date);
  const time = d.toLocaleTimeString("en-PK", {
    timeZone: ADMIN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatAdminDate(d)}, ${time}`;
}
