import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { COOKIE_CART_ID } from "@/lib/constants";
import { buildPayFastPaymentPayload } from "@/lib/server/payments/payfast";
import { rateLimitPayment } from "@/lib/rate-limit";
import { logPaymentEvent } from "@/lib/server/payments/payment-logger";

function redirectToCheckout(req: NextRequest, params?: Record<string, string>) {
  const url = new URL("/checkout", req.nextUrl.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAutoSubmitHtml(actionUrl: string, fields: Record<string, string>): string {
  const hiddenInputs = Object.entries(fields)
    .map(
      ([key, value]) =>
        `<input type=\"hidden\" name=\"${escapeHtml(key)}\" value=\"${escapeHtml(value)}\" />`,
    )
    .join("\n");

  return `<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Redirecting to PayFast</title>
  </head>
  <body style=\"font-family: Arial, sans-serif; padding: 24px;\">
    <p>Redirecting you to PayFast secure checkout...</p>
    <form id=\"payfast-form\" method=\"POST\" action=\"${escapeHtml(actionUrl)}\">${hiddenInputs}</form>
    <script>
      const form = document.getElementById('payfast-form');
      if (form) {
        form.submit();
      }
    </script>
    <noscript>
      <p>JavaScript is disabled. Click below to continue.</p>
      <button type=\"submit\" form=\"payfast-form\">Continue to PayFast</button>
    </noscript>
  </body>
</html>`;
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  const cartId = req.cookies.get(COOKIE_CART_ID)?.value;

  if (!orderId || !cartId) {
    return redirectToCheckout(req, { payment: "failed" });
  }

  // Rate limit: 3 payment attempts per 5 minutes per order
  const rl = await rateLimitPayment(orderId);
  if (!rl.allowed) {
    return new NextResponse("Too many payment attempts. Please wait and try again.", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      cartId: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentSessionId: true,
      totalPrice: true,
      updatedAt: true,
      trackingToken: true,
    },
  });

  if (!order || order.cartId !== cartId) {
    return redirectToCheckout(req, { payment: "failed" });
  }

  // Allow payment retry as long as the order has not already been paid and is
  // not in a terminal fulfilment state (shipped / delivered / cancelled).
  const alreadyPaid = order.paymentStatus === PaymentStatus.PAID;
  const isTerminalStatus =
    order.status === OrderStatus.SHIPPED ||
    order.status === OrderStatus.DELIVERED ||
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.REFUNDED;

  // If already paid, send straight to the success page — no failure needed.
  // Prefer the unguessable tracking token in the customer-visible URL.
  if (alreadyPaid) {
    const query = order.trackingToken
      ? `token=${encodeURIComponent(order.trackingToken)}`
      : `orderId=${orderId}`;
    return NextResponse.redirect(
      new URL(`/checkout/success?${query}`, req.nextUrl.origin),
    );
  }
  if (isTerminalStatus) {
    return redirectToCheckout(req, { payment: "failed", orderId });
  }

  // Guard against multiple tabs/double-clicks: if the order was sent to PayFast
  // within the last 30 seconds and is still PENDING, redirect to a "payment in
  // progress" state rather than generating a new token (which would create a
  // duplicate transaction).
  if (
    order.paymentStatus === PaymentStatus.PENDING &&
    order.status === OrderStatus.PENDING
  ) {
    const updatedAt =
      typeof order.updatedAt === "string" ? new Date(order.updatedAt) : order.updatedAt;
    const secondsSinceUpdate = (Date.now() - updatedAt.getTime()) / 1000;
    // Only if there's a paymentSessionId (meaning it was already sent to PayFast)
    if (order.paymentSessionId && secondsSinceUpdate < 30) {
      console.log("[PayFast checkout] Duplicate request within 30s — skipping", {
        orderId: order.id,
        secondsSinceUpdate: Math.round(secondsSinceUpdate),
      });
      logPaymentEvent({
        orderId: order.id,
        event: "DUPLICATE_BLOCKED",
        source: "checkout",
        message: `Duplicate checkout attempt blocked (${Math.round(secondsSinceUpdate)}s since last)`,
      });
      return new NextResponse(
        "Payment is already being processed. Please wait...",
        { status: 409 },
      );
    }
  }

  try {
    const customerIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "127.0.0.1";

    // Normalise IPv6 loopback → IPv4 so PayFast UAT accepts the value
    const normalizedIp = customerIp === "::1" ? "127.0.0.1" : customerIp;

    console.log("[PayFast checkout] building payload", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalPrice,
      customerIp: normalizedIp,
    });

    const payload = await buildPayFastPaymentPayload({
      amount: Number(order.totalPrice),
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerIp: normalizedIp,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: PaymentMethod.PAYFAST,
        paymentStatus: PaymentStatus.PENDING,
        // Persist the EXACT basket_id sent to PayFast (`${orderId}_${timestamp}`).
        // The reconciliation cron queries PayFast's transaction-status API by
        // basket_id, so it MUST match. Storing a synthetic `payfast_${id}` here
        // silently broke reconciliation — paid orders whose ITN never arrived
        // could never be recovered and were auto-expired as FAILED after 24h.
        paymentSessionId: payload.fields.basket_id,
        updatedAt: new Date(),
      },
    });

    logPaymentEvent({
      orderId: order.id,
      event: "CHECKOUT_INITIATED",
      source: "checkout",
      message: `PayFast checkout initiated for order #${order.orderNumber}, amount ${Number(order.totalPrice)}`,
    });

    return new NextResponse(renderAutoSubmitHtml(payload.actionUrl, payload.fields), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[PayFast checkout] Failed to initialize:", error);
    return redirectToCheckout(req, { payment: "failed", orderId });
  }
}
