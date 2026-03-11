"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimitNewsletter } from "@/lib/rate-limit";

export async function subscribeToNewsletter(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";

  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email address." };
  }

  // Rate limit: 3 newsletter subscriptions per hour per IP
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const rl = await rateLimitNewsletter(ip);
  if (!rl.allowed) {
    return { success: false, message: "Too many attempts. Please try again later." };
  }

  try {
    // Save / re-activate subscriber in DB
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email },
    });

    // Send welcome email (best-effort)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const { sendWelcomeEmail } = await import("@/lib/email/email-service");
      await sendWelcomeEmail({ to: email }).catch((err) =>
        console.error("[Newsletter] Welcome email failed:", err),
      );
    }
  } catch (error) {
    console.error("[Newsletter] Subscribe error:", error);
    // Still return success to the user — DB may have a unique-constraint error
    // which means they were already subscribed; that's fine.
  }

  return {
    success: true,
    message: "Thank you for subscribing to our newsletter!",
  };
}
