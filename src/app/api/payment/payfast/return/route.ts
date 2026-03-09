import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { CartStatus, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { adminRoutes } from "@/lib/routing/routes";
import { CACHE_TAG_CART, CACHE_TAG_PRODUCT } from "@/lib/constants";
import { isDemoMode } from "@/lib/server/helpers";
import {
  extractPayFastOrderId,
  isPayFastSuccess,
} from "@/lib/server/payments/payfast";

function redirectToCheckoutResult(
  req: NextRequest,
  input: { orderId?: string | null; success: boolean },
) {
  if (input.success && input.orderId) {
    return NextResponse.redirect(
      new URL(`/checkout/success?orderId=${input.orderId}`, req.nextUrl.origin),
    );
  }

  const url = new URL("/checkout", req.nextUrl.origin);
  url.searchParams.set("payment", "failed");
  if (input.orderId) {
    url.searchParams.set("orderId", input.orderId);
  }

  return NextResponse.redirect(url);
}

async function readRequestPayload(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";

  if (req.method === "GET") {
    const entries = Array.from(req.nextUrl.searchParams.entries());
    return Object.fromEntries(entries.map(([k, v]) => [k, String(v)]));
  }

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, String(value ?? "")]),
    );
  }

  const formData = await req.formData();
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );
}

async function markOrderPaymentFailed(orderId: string): Promise<void> {
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });

  if (!existingOrder) return;
  if (existingOrder.paymentStatus === PaymentStatus.PAID) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.FAILED,
      paymentMethod: PaymentMethod.STRIPE,
      updatedAt: new Date(),
    },
  });
}

async function markOrderPaymentSucceeded(
  orderId: string,
): Promise<{ transitioned: boolean }> {
  const result = await prisma.$transaction(async (tx) => {
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
      return { transitioned: false, couponCode: null as string | null };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { transitioned: false, couponCode: null as string | null };
    }

    if (!isDemoMode()) {
      await Promise.all(
        order.cart.items.map((item) =>
          tx.size.update({
            where: { id: item.sizeId },
            data: {
              stockReserved: { decrement: item.quantity },
              stockTotal: { decrement: item.quantity },
            },
          }),
        ),
      );
    }

    await Promise.all([
      tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: PaymentMethod.STRIPE,
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

    return { transitioned: true, couponCode: order.couponCode };
  });

  if (!result.transitioned) {
    return { transitioned: false };
  }

  if (result.couponCode) {
    try {
      await prisma.coupon.update({
        where: { code: result.couponCode },
        data: { currentUses: { increment: 1 } },
      });
    } catch (error) {
      console.error("Failed to increment coupon usage for PayFast order:", error);
    }
  }

  revalidateTag(CACHE_TAG_CART, "max");
  revalidateTag(CACHE_TAG_PRODUCT, "max");
  revalidatePath(adminRoutes.orders);
  revalidatePath(adminRoutes.products);

  try {
    const { sendOrderConfirmationEmails } = await import(
      "@/lib/server/actions/email-actions"
    );
    await sendOrderConfirmationEmails(orderId);
  } catch (error) {
    console.error("[PayFast] Failed to send order confirmation emails:", error);
  }

  return { transitioned: true };
}

async function handleReturn(req: NextRequest) {
  const payload = await readRequestPayload(req);
  const rawOrderRef = extractPayFastOrderId(payload);

  let orderId: string | null = null;
  if (rawOrderRef) {
    const byId = await prisma.order.findUnique({
      where: { id: rawOrderRef },
      select: { id: true },
    });

    if (byId) {
      orderId = byId.id;
    } else if (/^\d+$/.test(rawOrderRef)) {
      const byOrderNumber = await prisma.order.findFirst({
        where: { orderNumber: Number(rawOrderRef) },
        select: { id: true },
      });
      orderId = byOrderNumber?.id ?? null;
    }
  }

  if (!orderId) {
    return redirectToCheckoutResult(req, { success: false });
  }

  const success = isPayFastSuccess(payload);

  if (success) {
    await markOrderPaymentSucceeded(orderId);
  } else {
    await markOrderPaymentFailed(orderId);
  }

  return redirectToCheckoutResult(req, { orderId, success });
}

export async function GET(req: NextRequest) {
  return handleReturn(req);
}

export async function POST(req: NextRequest) {
  return handleReturn(req);
}
