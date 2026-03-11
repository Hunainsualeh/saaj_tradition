import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { CartStatus, OrderStatus } from "@prisma/client";
import { CACHE_TAG_CART } from "@/lib/constants";

/*

This API route is intended to be called by a scheduled job (e.g. via cron) to perform cleanup of stale carts and orders. It does the following:
1) Finds carts that are in CHECKOUT status and whose reservedAt is over 15 minutes ago, marks them as ABANDONED, and releases any reserved stock.
2) Deletes carts that are in ABANDONED or ACTIVE status and haven't been updated for over 2 months.
3) Deletes orders that are in PENDING status and whose associated carts are ABANDONED.

Note: In a production environment, this CRON job should run every 15 minutes to ensure timely cleanup of stale carts and orders.
Since this is a mock store running on a Vercel Hobby plan, the job is configured to run once daily instead.

*/

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const checkoutStaleThreshold = new Date(now - FIFTEEN_MINUTES_MS);
    const twoMonthsAgo = new Date(now - TWO_MONTHS_MS);

    // 1) Move stale checkout carts to abandoned and release reserved stock
    const cartsToAbandon = await prisma.cart.findMany({
      where: {
        status: CartStatus.CHECKOUT,
        reservedAt: { lt: checkoutStaleThreshold },
      },
      select: {
        id: true,
        items: {
          select: {
            sizeId: true,
            quantity: true,
          },
        },
      },
    });

    let abandonedCount = 0;
    for (const cart of cartsToAbandon) {
      await prisma.$transaction(async (tx) => {
        if (cart.items.length > 0) {
          await Promise.all(
            cart.items.map((item) =>
              tx.$executeRawUnsafe(
                `UPDATE "Size" SET "stockReserved" = GREATEST(0, "stockReserved" - $1) WHERE "id" = $2`,
                item.quantity,
                item.sizeId,
              ),
            ),
          );
        }

        await tx.cart.update({
          where: { id: cart.id },
          data: {
            status: CartStatus.ABANDONED,
            abandonedAt: new Date(),
            reservedAt: null,
          },
        });
      });

      abandonedCount += 1;
    }

    // 2) Delete stale carts (active/abandoned) older than 2 months
    const staleCartsResult = await prisma.cart.deleteMany({
      where: {
        status: { in: [CartStatus.ABANDONED, CartStatus.ACTIVE] },
        updatedAt: { lt: twoMonthsAgo },
      },
    });

    // 3) Delete pending orders whose carts are abandoned
    const staleOrdersResult = await prisma.order.deleteMany({
      where: {
        status: OrderStatus.PENDING,
        cart: { status: CartStatus.ABANDONED },
      },
    });

    if (abandonedCount > 0 || staleCartsResult.count > 0) {
      revalidateTag(CACHE_TAG_CART, "max");
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          cartsAbandoned: abandonedCount,
          cartsDeleted: staleCartsResult.count,
          ordersDeleted: staleOrdersResult.count,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Cleanup carts/orders job failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Cleanup carts/orders job failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
