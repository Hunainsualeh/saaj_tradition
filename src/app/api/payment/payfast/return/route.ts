import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { COOKIE_CART_ID } from "@/lib/constants";
import {
  extractPayFastOrderId,
  isPayFastSuccess,
} from "@/lib/server/payments/payfast";
import {
  markOrderPaymentFailed,
  markOrderPaymentSucceeded,
} from "@/lib/server/payments/payfast-db";
import { logPaymentEvent } from "@/lib/server/payments/payment-logger";

function redirectToCheckoutResult(
  req: NextRequest,
  input: { orderId?: string | null; success: boolean },
) {
  if (input.success && input.orderId) {
    const res = NextResponse.redirect(
      new URL(`/checkout/success?orderId=${input.orderId}`, req.nextUrl.origin),
    );
    // Clear the cart cookie so the cart empties after a successful payment
    res.cookies.delete(COOKIE_CART_ID);
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

  // Reject obviously empty or garbage payloads
  if (Object.keys(payload).length === 0) {
    console.warn("[PayFast Return] Empty payload received");
    return redirectToCheckoutResult(req, { success: false });
  }

  const rawOrderRef = extractPayFastOrderId(payload);

  console.log("[PayFast Return] Received callback", {
    method: req.method,
    rawOrderRef,
    errCode: payload.err_code ?? payload.code ?? payload.status_code ?? "unknown",
    errMsg: payload.err_msg ?? payload.message ?? "",
  });

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
    console.warn("[PayFast Return] Could not resolve order ID", { rawOrderRef });
    return redirectToCheckoutResult(req, { success: false });
  }

  const success = isPayFastSuccess(payload);

  try {
    if (success) {
      // Verify the payment amount matches the order total
      const amountGross = parseFloat(payload.amount_gross ?? "0");
      if (amountGross > 0) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { totalPrice: true, orderNumber: true },
        });
        if (order) {
          const orderTotal = Number(order.totalPrice);
          const diff = Math.abs(amountGross - orderTotal);
          if (diff > 1) {
            console.error("[PayFast Return] Amount mismatch — BLOCKING payment!", {
              orderId,
              orderNumber: order.orderNumber,
              expectedAmount: orderTotal,
              receivedAmount: amountGross,
              difference: diff,
            });
            logPaymentEvent({
              orderId,
              event: "RETURN_AMOUNT_MISMATCH",
              source: "return",
              payload: { expectedAmount: orderTotal, receivedAmount: amountGross, diff },
              message: `Amount mismatch: expected ${orderTotal}, got ${amountGross} (diff ${diff})`,
            });
            await markOrderPaymentFailed(orderId);
            return redirectToCheckoutResult(req, { orderId, success: false });
          }
        }
      }

      await markOrderPaymentSucceeded(orderId);
      logPaymentEvent({
        orderId,
        event: "RETURN_SUCCESS",
        source: "return",
        payload: { err_code: payload.err_code, amount_gross: payload.amount_gross },
        message: "Payment succeeded via return URL",
      });
      console.log("[PayFast Return] Payment succeeded", { orderId });
    } else {
      await markOrderPaymentFailed(orderId);
      logPaymentEvent({
        orderId,
        event: "RETURN_FAILED",
        source: "return",
        payload: { err_code: payload.err_code, err_msg: payload.err_msg, status_msg: payload.status_msg },
        message: `Payment failed via return URL (code: ${payload.err_code ?? "unknown"})`,
      });
      console.log("[PayFast Return] Payment failed/cancelled", { orderId });
    }
  } catch (error) {
    // DB or network error during status update — log it but still redirect
    // so the user isn't stuck on an error page. The ITN webhook or the
    // reconciliation cron will pick up the status change later.
    console.error("[PayFast Return] Error processing payment result:", error);
    logPaymentEvent({
      orderId,
      event: "RETURN_ERROR",
      source: "return",
      message: `Error processing return callback: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return redirectToCheckoutResult(req, { orderId, success });
}

export async function GET(req: NextRequest) {
  return handleReturn(req);
}

export async function POST(req: NextRequest) {
  return handleReturn(req);
}
