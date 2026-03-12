import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { CACHE_TAG_CART } from "@/lib/constants";
import {
  getPayFastTransactionStatus,
  isPayFastSuccess,
} from "@/lib/server/payments/payfast";
import {
  markOrderPaymentFailed,
  markOrderPaymentSucceeded,
} from "@/lib/server/payments/payfast-db";
import { logPaymentEvent } from "@/lib/server/payments/payment-logger";

/*
  Payment Reconciliation Cron

  This job runs every 10 minutes to catch orders that are stuck in PENDING
  payment status because:
    - The user closed the browser during redirect to PayFast
    - The user's 3D Secure page timed out
    - The ITN webhook failed due to network/timeout issues
    - The return URL callback errored (DB timeout under load)
    - Insufficient funds after redirect (PayFast debited but callback lost)

  For each stuck order, it queries PayFast's "Get Transaction Status" API
  using the `basket_id` (stored as `paymentSessionId` prefix + order ID).
  If PayFast says the payment was successful, we mark it as PAID.
  If PayFast says it definitively failed, we mark it FAILED.
  If the order has been PENDING for >2 hours without a paymentSessionId,
  we skip it (it was never sent to PayFast).

  Requires env var: PAYFAST_BASE_URL (the PayFast API base, e.g.
  https://api.gopayfast.com or UAT equivalent)
*/

function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

function formatDate(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Skip if PAYFAST_BASE_URL is not configured — reconciliation is optional
  if (!process.env.PAYFAST_BASE_URL) {
    return NextResponse.json(
      { success: true, skipped: true, reason: "PAYFAST_BASE_URL not configured" },
      { status: 200 },
    );
  }

  try {
    // Find orders stuck in PENDING payment status that have a paymentSessionId
    // (meaning they were sent to PayFast) and were updated between 5 minutes
    // and 24 hours ago. The 5-minute floor avoids querying orders that are
    // still in-flight at PayFast.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        paymentSessionId: { not: null },
        updatedAt: {
          gte: twentyFourHoursAgo,
          lte: fiveMinutesAgo,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        paymentSessionId: true,
        totalPrice: true,
        createdAt: true,
      },
      take: 50, // Process in batches to avoid timeout
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json(
        { success: true, processed: 0, reconciled: 0, failed: 0 },
        { status: 200 },
      );
    }

    console.log(`[Reconcile] Checking ${pendingOrders.length} pending order(s)`);

    let reconciled = 0;
    let markedFailed = 0;

    for (const order of pendingOrders) {
      try {
        // Reconstruct the basket_id that was sent to PayFast.
        // We stored paymentSessionId as `payfast_${orderId}`, but the actual
        // basket_id sent to PayFast was `${orderId}_${timestamp}`.
        // Since we don't store the exact basket_id, query by order_id instead
        // (PayFast also accepts order_id = orderNumber).
        // The transaction status API also accepts basket_id prefix matching.
        const basketId = order.id;
        const orderDate = formatDate(order.createdAt);

        const txnStatus = await getPayFastTransactionStatus(basketId, orderDate);

        if (!txnStatus) {
          // API unreachable — skip, will retry next cycle
          console.warn(`[Reconcile] Could not fetch status for order ${order.orderNumber}`);
          continue;
        }

        const success = isPayFastSuccess(txnStatus);

        if (success) {
          // Verify amount if available
          const amountGross = parseFloat(txnStatus.amount_gross ?? txnStatus.txnamt ?? "0");
          const orderTotal = Number(order.totalPrice);

          if (amountGross > 0 && Math.abs(amountGross - orderTotal) > 1) {
            console.error("[Reconcile] Amount mismatch for order", {
              orderId: order.id,
              orderNumber: order.orderNumber,
              expected: orderTotal,
              received: amountGross,
            });
            logPaymentEvent({
              orderId: order.id,
              event: "RECONCILE_AMOUNT_MISMATCH",
              source: "reconcile",
              payload: { expected: orderTotal, received: amountGross },
              message: `Reconcile amount mismatch: expected ${orderTotal}, got ${amountGross}`,
            });
            await markOrderPaymentFailed(order.id);
            markedFailed++;
            continue;
          }

          const result = await markOrderPaymentSucceeded(order.id);
          if (result.transitioned) {
            reconciled++;
            logPaymentEvent({
              orderId: order.id,
              event: "RECONCILE_SUCCESS",
              source: "reconcile",
              message: `Order #${order.orderNumber} reconciled as PAID by cron`,
            });
            console.log(`[Reconcile] Order #${order.orderNumber} marked as PAID`);
          }
        } else {
          // Check if the code indicates a definitive failure (not just pending)
          const code = txnStatus.status_code ?? txnStatus.code ?? txnStatus.err_code ?? "";
          const isPending = code === "001"; // 001 = Pending per PayFast docs

          if (!isPending && code !== "") {
            await markOrderPaymentFailed(order.id);
            markedFailed++;
            logPaymentEvent({
              orderId: order.id,
              event: "RECONCILE_FAILED",
              source: "reconcile",
              payload: { code },
              message: `Order #${order.orderNumber} reconciled as FAILED (code: ${code})`,
            });
            console.log(`[Reconcile] Order #${order.orderNumber} marked as FAILED (code: ${code})`);
          }
          // If pending or no code, leave it — will check again next cycle
        }
      } catch (error) {
        console.error(`[Reconcile] Error processing order ${order.id}:`, error);
      }
    }

    if (reconciled > 0 || markedFailed > 0) {
      revalidateTag(CACHE_TAG_CART, "max");
    }

    // Auto-expire very old PENDING orders (>24h) that were never completed.
    // These are orders sent to PayFast but never resolved by return/ITN/reconcile.
    let expired = 0;
    try {
      const expiredOrders = await prisma.order.findMany({
        where: {
          paymentStatus: PaymentStatus.PENDING,
          paymentSessionId: { not: null },
          updatedAt: { lt: twentyFourHoursAgo },
        },
        select: { id: true, orderNumber: true },
        take: 50,
      });

      for (const order of expiredOrders) {
        await markOrderPaymentFailed(order.id);
        logPaymentEvent({
          orderId: order.id,
          event: "RECONCILE_FAILED",
          source: "reconcile",
          message: `Order #${order.orderNumber} auto-expired after 24h PENDING`,
        });
        expired++;
      }

      if (expired > 0) {
        revalidateTag(CACHE_TAG_CART, "max");
        console.log(`[Reconcile] Auto-expired ${expired} order(s) older than 24h`);
      }
    } catch (error) {
      console.error("[Reconcile] Error expiring old orders:", error);
    }

    return NextResponse.json(
      {
        success: true,
        processed: pendingOrders.length,
        reconciled,
        failed: markedFailed,
        expired,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Reconcile] Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: "Reconciliation failed" },
      { status: 500 },
    );
  }
}
