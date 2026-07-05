"use server";

import { revalidatePath } from "next/cache";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  CartStatus,
  PaymentMethod,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { wrapServerCall } from "../helpers";
import { requireAdmin } from "../helpers/require-admin";
import { DeliveryDetailsData } from "@/components";
import { deliveryDetailsSchema } from "@/components/common/CheckoutForm/schema";
import { cookies } from "next/headers";
import { COOKIE_CART_ID, COOKIE_COUPON_CODE } from "@/lib/constants";
import { adminRoutes } from "@/lib/routing";
import { sendOrderConfirmationEmails, sendOrderStatusEmail } from "./email-actions";
import { buildPayFastPaymentPayload } from "@/lib/server/payments/payfast";

// === QUERIES ===
export async function getCurrentOrder(): Promise<
  ServerActionResponse<Order | null>
> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();
    const cartId = cookieStore.get(COOKIE_CART_ID)?.value;

    if (!cartId) return null;

    const order = await prisma.order.findUnique({
      where: { cartId },
    });

    // If the order was already paid (e.g. stale cookie after a successful
    // payment), treat it as "no current order" so the user is sent to /cart
    // and can start a fresh purchase without needing any manual intervention.
    if (
      order?.paymentStatus === PaymentStatus.PAID ||
      order?.status === OrderStatus.SHIPPED ||
      order?.status === OrderStatus.DELIVERED ||
      order?.status === OrderStatus.CANCELLED ||
      order?.status === OrderStatus.REFUNDED
    ) {
      return null;
    }

    // If the order has been sitting in PENDING payment status (i.e. the PayFast
    // return/notify URL was never called — common in local dev when the gateway
    // cannot reach localhost) for longer than 2 hours, treat it as abandoned so
    // the user can go back to cart and try a fresh checkout.
    if (order && order.paymentStatus === PaymentStatus.PENDING) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      if (order.updatedAt < twoHoursAgo) {
        console.info(`[getCurrentOrder] Order ${order.id} has been PENDING for >2 h — treating as abandoned`);
        return null;
      }
    }

    return order;
  });
}

// === MUTATIONS ===
export async function updateOrderDetails(
  orderId: string,
  input: DeliveryDetailsData,
): Promise<ServerActionResponse<string>> {
  return wrapServerCall(async () => {
    // Re-validate on the server: the client zod check can be bypassed by a
    // crafted request, and an order with a bad/empty email breaks fulfilment
    // and confirmation emails.
    const parsed = deliveryDetailsSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? "Invalid delivery details",
      );
    }
    input = parsed.data;

    // Validate order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    // Block modification only when payment is confirmed or the order is in a
    // terminal fulfilment state. FAILED paymentStatus (after a failed PayFast
    // attempt) keeps the order open for retry.
    const isPaid = existingOrder.paymentStatus === PaymentStatus.PAID;
    const isTerminal = (
      existingOrder.status === OrderStatus.SHIPPED ||
      existingOrder.status === OrderStatus.DELIVERED ||
      existingOrder.status === OrderStatus.CANCELLED ||
      existingOrder.status === OrderStatus.REFUNDED
    );
    if (isPaid || isTerminal) {
      throw new Error("Order cannot be modified");
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        delieveryName: input.fullName,
        deliveryEmail: input.email,
        deliveryPhone: input.phone,
        deliveryStreetAddress: input.address,
        deliveryCity: input.city,
        deliveryState: input.state,
        deliveryPostcode: input.zipCode,
        deliveryCountry: input.country,

        billingName: input.fullName,
        billingStreetAddress: input.useSameBillingAddress
          ? input.address
          : input.billingAddress,
        billingCity: input.useSameBillingAddress
          ? input.city
          : input.billingCity,
        billingState: input.useSameBillingAddress
          ? input.state
          : input.billingState,
        billingPostcode: input.useSameBillingAddress
          ? input.zipCode
          : input.billingZipCode,
        billingCountry: input.useSameBillingAddress
          ? input.country
          : input.billingCountry,

        orderNote: input.orderNote ?? null,

        // Clear the payment session so the duplicate-request guard in the
        // PayFast checkout route doesn't block a fresh payment attempt.
        paymentSessionId: null,

        updatedAt: new Date(),
      },
    });

    revalidatePath(adminRoutes.orders);

    return orderId;
  });
}

/** Mark an order as paid + cart as ORDERED for COD orders. */
export async function markOrderAsPaid(
  orderId: string,
): Promise<ServerActionResponse<{ trackingToken: string | null }>> {
  return wrapServerCall(async () => {
    // Verify the caller owns this order (cart cookie must match)
    const cookieStore = await cookies();
    const cartId = cookieStore.get(COOKIE_CART_ID)?.value;

    const trackingToken = await prisma.$transaction(async (tx) => {
      // Row-level lock so a double-submit (or COD + a racing PayFast callback)
      // can't both read PENDING and both decrement stock. The second caller
      // blocks here until the first commits, then the idempotency check below
      // short-circuits it.
      await tx.$executeRawUnsafe(
        `SELECT "id" FROM "Order" WHERE "id" = $1 FOR UPDATE`,
        orderId,
      );

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          cart: {
            include: {
              items: { select: { sizeId: true, quantity: true } },
            },
          },
        },
      });

      if (!order) throw new Error("Order not found");

      if (!cartId || order.cartId !== cartId) {
        throw new Error("Unauthorized");
      }

      // Idempotency: skip if already paid
      if (order.paymentStatus === PaymentStatus.PAID) return order.trackingToken;

      // Decrement stock for COD orders (not done during checkout, only reserved)
      if (order.cart.items.length > 0) {
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
            status: OrderStatus.PROCESSING,
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: PaymentMethod.COD,
            updatedAt: new Date(),
          },
        }),
        tx.cart.update({
          where: { id: order.cartId },
          data: { status: CartStatus.ORDERED },
        }),
      ]);

      // Increment coupon usage inside transaction
      if (order.couponCode) {
        try {
          await tx.coupon.update({
            where: { code: order.couponCode },
            data: { currentUses: { increment: 1 } },
          });
        } catch (error) {
          console.error("Failed to increment coupon usage for COD order:", error);
        }
      }

      return order.trackingToken;
    });

    revalidatePath(adminRoutes.orders);

    // Clear cart and coupon cookies — order is placed
    cookieStore.delete(COOKIE_CART_ID);
    cookieStore.delete(COOKIE_COUPON_CODE);

    // Send confirmation emails (non-blocking)
    sendOrderConfirmationEmails(orderId).catch((err) => {
      console.error("[Email] Failed to send order confirmation after markOrderAsPaid:", err);
    });

    return { trackingToken: trackingToken ?? null };
  });
}

export type InitiatePayFastCheckoutResponse = {
  actionUrl: string;
  fields: Record<string, string>;
};

/** Build PayFast form payload for a pending order */
export async function initiatePayFastCheckout(
  orderId: string,
): Promise<ServerActionResponse<InitiatePayFastCheckoutResponse>> {
  return wrapServerCall(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalPrice: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error("Only pending orders can be paid");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new Error("Order is already paid");
    }

    const payload = await buildPayFastPaymentPayload({
      amount: Number(order.totalPrice),
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    // Persist the EXACT basket_id we sent to PayFast (orderId_timestamp) as the
    // session marker. The reconciliation cron queries PayFast's transaction
    // status API by basket_id, so it must match exactly — storing the synthetic
    // `payfast_${id}` here previously made reconciliation unable to find the txn.
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: PaymentMethod.PAYFAST,
        paymentStatus: PaymentStatus.PENDING,
        paymentSessionId: payload.fields.basket_id,
        updatedAt: new Date(),
      },
    });

    return {
      actionUrl: payload.actionUrl,
      fields: payload.fields,
    };
  });
}

/** Update order status (admin) */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  options?: { sendEmail?: boolean; customMessage?: string },
): Promise<ServerActionResponse<{ id: string; status: string }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status as OrderStatus)) {
      throw new Error(`Invalid order status: ${status}`);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus, updatedAt: new Date() },
    });

    revalidatePath(adminRoutes.orders);
    revalidatePath(`${adminRoutes.orders}/${orderId}`);

    // Optionally send status update email to customer
    if (options?.sendEmail && updated.deliveryEmail) {
      sendOrderStatusEmail(orderId, options.customMessage).catch((err) => {
        console.error("[Email] Failed to send order status update email:", err);
      });
    }

    return { id: updated.id, status: updated.status };
  });
}

/** Update payment status (admin) */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: string,
): Promise<ServerActionResponse<{ id: string; paymentStatus: string }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const validStatuses = Object.values(PaymentStatus);
    if (!validStatuses.includes(paymentStatus as PaymentStatus)) {
      throw new Error(`Invalid payment status: ${paymentStatus}`);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: paymentStatus as PaymentStatus, updatedAt: new Date() },
    });

    revalidatePath(adminRoutes.orders);
    revalidatePath(`${adminRoutes.orders}/${orderId}`);

    return { id: updated.id, paymentStatus: updated.paymentStatus };
  });
}

/** Recalculate and fix order totalPrice from its orderItems snapshot (admin correction tool) */
export async function recalculateOrderTotal(
  orderId: string,
): Promise<ServerActionResponse<number>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderItems: {
          select: { unitPrice: true, quantity: true },
        },
        cart: {
          select: {
            items: {
              select: { unitPrice: true, quantity: true },
            },
          },
        },
        shippingAmount: true,
        discountAmount: true,
      },
    });

    if (!order) throw new Error("Order not found");

    // Prefer the frozen orderItems snapshot; fall back to live cart for legacy orders
    const items = order.orderItems.length > 0 ? order.orderItems : order.cart.items;
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
      0,
    );
    const shipping = order.shippingAmount ? order.shippingAmount.toNumber() : 0;
    const discount = order.discountAmount ? order.discountAmount.toNumber() : 0;
    const newTotal = Math.max(subtotal + shipping - discount, 0);

    await prisma.order.update({
      where: { id: orderId },
      data: { totalPrice: new Decimal(newTotal), updatedAt: new Date() },
    });

    revalidatePath(`${adminRoutes.orders}/${orderId}`);
    revalidatePath(adminRoutes.orders);

    return newTotal;
  });
}
