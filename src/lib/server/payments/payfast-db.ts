import { revalidatePath, revalidateTag } from "next/cache";
import { CartStatus, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { adminRoutes } from "@/lib/routing/routes";
import { CACHE_TAG_CART, CACHE_TAG_PRODUCT } from "@/lib/constants";
import { isDemoMode } from "@/lib/server/helpers";
import { invalidateTags } from "@/lib/redis-cache";

export async function markOrderPaymentFailed(orderId: string): Promise<void> {
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });

  if (!existingOrder) return;
  if (existingOrder.paymentStatus === PaymentStatus.PAID) return;

  await prisma.order.update({
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
}

export async function markOrderPaymentSucceeded(
  orderId: string,
): Promise<{ transitioned: boolean }> {
  const result = await prisma.$transaction(
    async (tx) => {
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

  revalidateTag(CACHE_TAG_CART, "max");
  revalidateTag(CACHE_TAG_PRODUCT, "max");
  invalidateTags([CACHE_TAG_CART, CACHE_TAG_PRODUCT]);
  revalidatePath(adminRoutes.orders);
  revalidatePath(adminRoutes.products);

  try {
    const { enqueueEmail } = await import("@/lib/redis-queue");
    const { sendOrderConfirmationEmails } = await import(
      "@/lib/server/actions/email-actions"
    );
    await enqueueEmail(
      { orderId, type: "order_confirmation" },
      async () => { await sendOrderConfirmationEmails(orderId); },
    );
  } catch (error) {
    console.error("[PayFast] Failed to queue order confirmation emails:", error);
  }

  return { transitioned: true };
}
