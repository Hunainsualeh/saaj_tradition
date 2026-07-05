import { ServerActionResponse } from "@/types/server";

export async function wrapServerCall<T>(
  fn: () => Promise<T>,
): Promise<ServerActionResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    console.error(error);

    // Surface intentional, user-facing messages (thrown as a plain Error, e.g.
    // "Not enough stock", "Unauthorized") but never leak internal DB/driver
    // errors — Prisma exceptions embed schema/query internals. Those, and any
    // non-Error throw, get a generic message.
    const name = (error as { name?: string })?.name ?? "";
    const isInternalError = name.startsWith("PrismaClient") || !(error instanceof Error);
    return {
      success: false,
      error: isInternalError
        ? "Something went wrong. Please try again."
        : (error as Error).message,
    };
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getReadingMinutes(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).length;
  const minutes = words / wordsPerMinute;
  return Math.ceil(minutes);
}
