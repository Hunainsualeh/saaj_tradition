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

export async function POST(req: NextRequest) {
  const text = await req.text();
  const searchParams = new URLSearchParams(text);
  const payload = Object.fromEntries(searchParams.entries());

  console.log("[PayFast ITN] Received webhook", {
    paymentStatus: payload.payment_status ?? payload.pf_payment_id ?? "unknown",
  });

  const isValid = await validatePayFastITN(payload);
  if (!isValid) {
    console.warn("[PayFast ITN] Validation failed for payload:", payload);
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

  const success = isPayFastSuccess(payload);

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
          await markOrderPaymentFailed(orderId);
          return new NextResponse("Amount mismatch", { status: 400 });
        }
      }
    }

    await markOrderPaymentSucceeded(orderId);
    console.log("[PayFast ITN] Payment succeeded", { orderId });
  } else {
    await markOrderPaymentFailed(orderId);
    console.log("[PayFast ITN] Payment failed/cancelled", { orderId });
  }

  return new NextResponse("OK", { status: 200 });
}
