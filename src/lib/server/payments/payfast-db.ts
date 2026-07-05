import { revalidatePath, revalidateTag } from "next/cache";
import { CartStatus, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { adminRoutes } from "@/lib/routing/routes";
import { CACHE_TAG_CART, CACHE_TAG_PRODUCT } from "@/lib/constants";
import { isDemoMode } from "@/lib/server/helpers";
import { invalidateTags } from "@/lib/redis-cache";
import { logPaymentEvent } from "@/lib/server/payments/payment-logger";

export async function markOrderPaymentFailed(orderId: string): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Row-level lock to prevent race with concurrent success callback
      const rows = await tx.$queryRawUnsafe<{ id: string; paymentStatus: string }[]>(
        `SELECT "id", "paymentStatus" FROM "Order" WHERE "id" = $1 FOR UPDATE`,
        orderId,
      );

      const existingOrder = rows[0];
      if (!existingOrder) return;
      if (existingOrder.paymentStatus === PaymentStatus.PAID) return;

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          paymentMethod: PaymentMethod.PAYFAST,
          // Clear the session marker so the next initiateCheckout call can
          // build a completely fresh PayFast token + basket_id.
          paymentSessionId: null,
          updatedAt: new Date(),
        },
      });
    });

    logPaymentEvent({
      orderId,
      event: "MARKED_FAILED",
      source: "system",
      message: "Order payment status set to FAILED",
    });
  } catch (error) {
    console.error("[PayFast] markOrderPaymentFailed error:", error);
  }
}

export async function markOrderPaymentSucceeded(
  orderId: string,
): Promise<{ transitioned: boolean }> {
  const result = await prisma.$transaction(
    async (tx) => {
    // Row-level lock prevents double-processing when return URL + ITN
    // arrive simultaneously (concurrent requests both read PENDING, both
    // try to mark as PAID). FOR UPDATE blocks the second caller until the
    // first commits, then the idempotency check catches it.
    await tx.$executeRawUnsafe(
      `SELECT "id" FROM "Order" WHERE "id" = $1 FOR UPDATE`,
      orderId,
    );

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        cart: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      return { transitioned: false };
    }

    // Idempotency: if already paid, do nothing
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { transitioned: false };
    }

    if (!isDemoMode()) {
      // Decrement stock with safety bounds (never go below 0)
      await Promise.all(
        order.cart.items.map((item) =>
          tx.$executeRawUnsafe(
            `UPDATE "Size" SET "stockReserved" = GREATEST(0, "stockReserved" - $1), "stockTotal" = GREATEST(0, "stockTotal" - $1) WHERE "id" = $2`,
            item.quantity,
            item.sizeId,
          ),
        ),
      );
    }

    await Promise.all([
      tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: PaymentMethod.PAYFAST,
          updatedAt: new Date(),
        },
      }),
      tx.cart.update({
        where: { id: order.cartId },
        data: {
          status: CartStatus.ORDERED,
          checkoutAt: new Date(),
        },
      }),
    ]);

    // Increment coupon usage INSIDE the transaction to prevent double-increment
    if (order.couponCode) {
      try {
        await tx.coupon.update({
          where: { code: order.couponCode },
          data: { currentUses: { increment: 1 } },
        });
      } catch (error) {
        console.error("Failed to increment coupon usage for PayFast order:", error);
      }
    }

    return { transitioned: true };
  },
    { timeout: 15000 },
  );

  if (!result.transitioned) {
    return { transitioned: false };
  }

  logPaymentEvent({
    orderId,
    event: "MARKED_PAID",
    source: "system",
    message: "Order payment status set to PAID, stock decremented, cart marked ORDERED",
  });

  revalidateTag(CACHE_TAG_CART, "max");
  revalidateTag(CACHE_TAG_PRODUCT, "max");
  invalidateTags([CACHE_TAG_CART, CACHE_TAG_PRODUCT]);
  revalidatePath(adminRoutes.orders);
  revalidatePath(adminRoutes.products);

  try {
    const { sendOrderConfirmationEmails } = await import(
      "@/lib/server/actions/email-actions"
    );
    // Send inline, awaited so it completes before a serverless invocation is
    // frozen. The background email queue + its cron worker were removed, so this
    // now mirrors the COD path in order-actions, which also sends confirmation
    // emails directly.
    await sendOrderConfirmationEmails(orderId);
  } catch (error) {
    console.error("[PayFast] Failed to send order confirmation emails:", error);
  }

  return { transitioned: true };
}
