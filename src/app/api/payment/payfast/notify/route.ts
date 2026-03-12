import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extractPayFastOrderId,
  isPayFastSuccess,
  validatePayFastITN,
} from "@/lib/server/payments/payfast";
import {
  markOrderPaymentFailed,
  markOrderPaymentSucceeded,
} from "@/lib/server/payments/payfast-db";
import { logPaymentEvent } from "@/lib/server/payments/payment-logger";

export async function POST(req: NextRequest) {
  let text: string;
  try {
    text = await req.text();
  } catch (error) {
    console.error("[PayFast ITN] Failed to read request body:", error);
    return new NextResponse("Bad Request", { status: 400 });
  }

  const searchParams = new URLSearchParams(text);
  const payload = Object.fromEntries(searchParams.entries());

  // Reject empty payloads
  if (Object.keys(payload).length === 0) {
    console.warn("[PayFast ITN] Empty payload received");
    return new NextResponse("Empty payload", { status: 400 });
  }

  console.log("[PayFast ITN] Received webhook", {
    paymentStatus: payload.payment_status ?? payload.pf_payment_id ?? "unknown",
  });

  const isValid = await validatePayFastITN(payload);
  if (!isValid) {
    console.warn("[PayFast ITN] Validation failed for payload:", payload);
    // Try to log with whatever order ref we can extract
    const rawRef = extractPayFastOrderId(payload);
    if (rawRef) {
      logPaymentEvent({
        orderId: rawRef,
        event: "ITN_INVALID",
        source: "itn",
        payload,
        message: "ITN signature validation failed",
      });
    }
    return new NextResponse("Invalid ITN Signature", { status: 400 });
  }

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
    console.warn("[PayFast ITN] Could not resolve order ID", { rawOrderRef });
    return new NextResponse("Order not found", { status: 404 });
  }

  logPaymentEvent({
    orderId,
    event: "ITN_RECEIVED",
    source: "itn",
    payload: { payment_status: payload.payment_status, err_code: payload.err_code, amount_gross: payload.amount_gross },
    message: `ITN webhook received for order`,
  });

  const success = isPayFastSuccess(payload);

  try {
    if (success) {
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
            console.error("[PayFast ITN] Amount mismatch — BLOCKING payment!", {
              orderId,
              orderNumber: order.orderNumber,
              expectedAmount: orderTotal,
              receivedAmount: amountGross,
              difference: diff,
            });
            logPaymentEvent({
              orderId,
              event: "ITN_AMOUNT_MISMATCH",
              source: "itn",
              payload: { expectedAmount: orderTotal, receivedAmount: amountGross, diff },
              message: `ITN amount mismatch: expected ${orderTotal}, got ${amountGross}`,
            });
            await markOrderPaymentFailed(orderId);
            return new NextResponse("Amount mismatch", { status: 400 });
          }
        }
      }

      await markOrderPaymentSucceeded(orderId);
      logPaymentEvent({
        orderId,
        event: "ITN_SUCCESS",
        source: "itn",
        payload: { payment_status: payload.payment_status, amount_gross: payload.amount_gross },
        message: "Payment confirmed via ITN webhook",
      });
      console.log("[PayFast ITN] Payment succeeded", { orderId });
    } else {
      await markOrderPaymentFailed(orderId);
      logPaymentEvent({
        orderId,
        event: "ITN_FAILED",
        source: "itn",
        payload: { err_code: payload.err_code, payment_status: payload.payment_status },
        message: `Payment failed via ITN (code: ${payload.err_code ?? "unknown"})`,
      });
      console.log("[PayFast ITN] Payment failed/cancelled", { orderId });
    }
  } catch (error) {
    // DB or processing error — return 500 so PayFast retries the ITN later.
    console.error("[PayFast ITN] Error processing payment result:", error);
    logPaymentEvent({
      orderId,
      event: "ITN_ERROR",
      source: "itn",
      message: `Error processing ITN: ${error instanceof Error ? error.message : String(error)}`,
    });
    return new NextResponse("Internal error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
