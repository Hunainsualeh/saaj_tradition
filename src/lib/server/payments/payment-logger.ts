import { prisma } from "@/lib/prisma";

export type PaymentEventType =
  | "CHECKOUT_INITIATED"
  | "RETURN_SUCCESS"
  | "RETURN_FAILED"
  | "RETURN_ERROR"
  | "RETURN_AMOUNT_MISMATCH"
  | "ITN_RECEIVED"
  | "ITN_SUCCESS"
  | "ITN_FAILED"
  | "ITN_INVALID"
  | "ITN_ERROR"
  | "ITN_AMOUNT_MISMATCH"
  | "RECONCILE_SUCCESS"
  | "RECONCILE_FAILED"
  | "RECONCILE_AMOUNT_MISMATCH"
  | "RECONCILE_SKIPPED"
  | "MARKED_PAID"
  | "MARKED_FAILED"
  | "DUPLICATE_BLOCKED"
  | "ADMIN_STATUS_CHANGE";

export type PaymentEventSource =
  | "checkout"
  | "return"
  | "itn"
  | "reconcile"
  | "admin"
  | "system";

/**
 * Log a payment event for audit trail. Fire-and-forget — never blocks
 * or throws, so it won't interfere with payment processing.
 */
export function logPaymentEvent(input: {
  orderId: string;
  event: PaymentEventType;
  source: PaymentEventSource;
  payload?: Record<string, unknown> | null;
  message?: string;
}): void {
  prisma.paymentEvent
    .create({
      data: {
        orderId: input.orderId,
        event: input.event,
        source: input.source,
        payload: input.payload ? JSON.stringify(input.payload) : null,
        message: input.message ?? null,
      },
    })
    .catch((err: unknown) => {
      console.error("[PaymentEvent] Failed to log event:", err);
    });
}
