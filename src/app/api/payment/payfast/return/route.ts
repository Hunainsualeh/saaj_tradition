import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { COOKIE_CART_ID, COOKIE_COUPON_CODE } from "@/lib/constants";
import { extractPayFastOrderId, isPayFastSuccess } from "@/lib/server/payments/payfast";
import { logPaymentEvent } from "@/lib/server/payments/payment-logger";

/*
  PayFast Return URL handler.

  This is the browser-redirect URL the customer is sent to AFTER completing (or
  cancelling) payment on the PayFast-hosted page. It is NOT a secure server-to-
  server callback — the customer's browser controls it. Therefore we ONLY use it
  to redirect the customer to the appropriate page.

  ALL business logic (marking orders paid, decrementing stock, sending emails) is
  handled exclusively by the ITN (Instant Transaction Notification) webhook at
  /api/payment/payfast/notify, which PayFast posts server-to-server with a
  validated signature. The reconciliation cron catches any ITNs that fail to
  arrive within 10 minutes.
*/

function redirectToCheckoutResult(
  req: NextRequest,
  input: { orderId?: string | null; trackingToken?: string | null; success: boolean },
) {
  if (input.success && (input.trackingToken || input.orderId)) {
    // Prefer the unguessable tracking token in the customer-visible URL.
    const query = input.trackingToken
      ? `token=${encodeURIComponent(input.trackingToken)}`
      : `orderId=${input.orderId}`;
    const res = NextResponse.redirect(
      new URL(`/checkout/success?${query}`, req.nextUrl.origin),
    );
    // Clear cart and coupon cookies after a successful payment
    res.cookies.delete(COOKIE_CART_ID);
    res.cookies.delete(COOKIE_COUPON_CODE);
    return res;
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

async function handleReturn(req: NextRequest) {
  let payload: Record<string, string>;
  try {
    payload = await readRequestPayload(req);
  } catch (error) {
    console.error("[PayFast Return] Malformed request payload:", error);
    return redirectToCheckoutResult(req, { success: false });
  }

  if (Object.keys(payload).length === 0) {
    console.warn("[PayFast Return] Empty payload received");
    return redirectToCheckoutResult(req, { success: false });
  }

  const rawOrderRef = extractPayFastOrderId(payload);
  const success = isPayFastSuccess(payload);

  console.log("[PayFast Return] Browser redirect received", {
    method: req.method,
    rawOrderRef,
    success,
    errCode: payload.err_code ?? payload.code ?? "unknown",
  });

  let orderId: string | null = null;
  let trackingToken: string | null = null;
  if (rawOrderRef) {
    const byId = await prisma.order.findUnique({
      where: { id: rawOrderRef },
      select: { id: true, trackingToken: true },
    });

    if (byId) {
      orderId = byId.id;
      trackingToken = byId.trackingToken;
    } else if (/^\d+$/.test(rawOrderRef)) {
      const byOrderNumber = await prisma.order.findFirst({
        where: { orderNumber: Number(rawOrderRef) },
        select: { id: true, trackingToken: true },
      });
      orderId = byOrderNumber?.id ?? null;
      trackingToken = byOrderNumber?.trackingToken ?? null;
    }
  }

  // Log the return event for audit trail — no DB state changes here
  if (orderId) {
    logPaymentEvent({
      orderId,
      event: success ? "RETURN_SUCCESS_REDIRECT" : "RETURN_FAILED_REDIRECT",
      source: "return",
      payload: { err_code: payload.err_code, amount_gross: payload.amount_gross },
      message: success
        ? "Customer redirected to success page via return URL (ITN is authoritative)"
        : `Customer redirected to failure page via return URL (code: ${payload.err_code ?? "unknown"})`,
    });
  } else {
    console.warn("[PayFast Return] Could not resolve order ID for logging", { rawOrderRef });
  }

  // Redirect only — no markOrderPaymentSucceeded / markOrderPaymentFailed here.
  // The ITN (/notify) webhook is the sole authoritative source for payment state.
  return redirectToCheckoutResult(req, { orderId, trackingToken, success });
}

export async function GET(req: NextRequest) {
  return handleReturn(req);
}

export async function POST(req: NextRequest) {
  return handleReturn(req);
}
