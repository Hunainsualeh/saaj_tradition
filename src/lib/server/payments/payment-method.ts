import { PaymentMethod } from "@prisma/client";

import { prisma } from "@/lib/prisma";

let cachedOnlinePaymentMethod: PaymentMethod | null = null;

async function databaseSupportsPayFastEnum(): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ has_payfast: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'PaymentMethod'
          AND e.enumlabel = 'PAYFAST'
      ) AS has_payfast
    `;

    return Boolean(rows[0]?.has_payfast);
  } catch (error) {
    console.warn(
      "[PaymentMethod] Failed to detect enum values. Defaulting to PAYFAST.",
      error,
    );
    return true;
  }
}

export async function getOnlinePaymentMethodForDb(): Promise<PaymentMethod> {
  if (cachedOnlinePaymentMethod) {
    return cachedOnlinePaymentMethod;
  }

  const supportsPayFast = await databaseSupportsPayFastEnum();

  // Legacy databases still use STRIPE as the online gateway enum value.
  cachedOnlinePaymentMethod = supportsPayFast
    ? PaymentMethod.PAYFAST
    : ("STRIPE" as unknown as PaymentMethod);

  return cachedOnlinePaymentMethod;
}
