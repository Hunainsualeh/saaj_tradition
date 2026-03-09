"use server";

import { prisma } from "@/lib/prisma";

export async function subscribeToNewsletter(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";

  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email address." };
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
