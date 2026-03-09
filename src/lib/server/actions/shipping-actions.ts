"use server";

import { revalidatePath, updateTag } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { adminRoutes } from "@/lib/routing";
import { wrapServerCall } from "../helpers/generic-helpers";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { CACHE_TAG_CART } from "@/lib/constants";

export type ProductShippingItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  shippingCharge: number | null;
};

// === READ GLOBAL RATE ===
export async function getGlobalShippingRate(): Promise<
  ServerActionResponse<number>
> {
  return wrapServerCall(async () => {
    const record = await prisma.siteContent.findUnique({
      where: { key: "shipping_charge" },
    });
    if (!record) return 0;
    const parsed = parseFloat(record.value);
    return isNaN(parsed) ? 0 : parsed;
  });
}

// === UPDATE GLOBAL RATE ===
export async function updateGlobalShippingRate(
  amount: number,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) return;

    await prisma.siteContent.upsert({
      where: { key: "shipping_charge" },
      update: { value: amount.toFixed(2) },
      create: {
        key: "shipping_charge",
        value: amount.toFixed(2),
        label: "Shipping Charge (e.g. 10.00, set 0 for free shipping)",
        group: "shipping",
      },
    });

    revalidatePath(adminRoutes.shipping);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    updateTag(CACHE_TAG_CART);
  });
}

// === GET ALL PRODUCTS WITH SHIPPING ===
export async function getAllProductsForShipping(): Promise<
  ServerActionResponse<ProductShippingItem[]>
> {
  return wrapServerCall(async () => {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        shippingCharge: true,
      },
      orderBy: { name: "asc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      shippingCharge: p.shippingCharge !== null ? Number(p.shippingCharge) : null,
    }));
  });
}

// === BULK UPDATE PRODUCT SHIPPING CHARGES ===
export async function bulkUpdateProductShippingCharges(
  updates: { id: string; shippingCharge: number | null }[],
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    if (isDemoMode()) return;

    await Promise.all(
      updates.map((u) =>
        prisma.product.update({
          where: { id: u.id },
          data: {
            shippingCharge:
              u.shippingCharge !== null
                ? new Decimal(u.shippingCharge)
                : null,
          },
        }),
      ),
    );

    revalidatePath(adminRoutes.shipping);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    updateTag(CACHE_TAG_CART);
  });
}

// === COMPUTE CART SHIPPING ===
// Returns the effective shipping charge for a set of cart item product IDs.
// Picks the maximum of per-product overrides; falls back to global rate.
export async function computeCartShipping(
  productIds: string[],
): Promise<number> {
  const [globalRecord, products] = await Promise.all([
    prisma.siteContent.findUnique({ where: { key: "shipping_charge" } }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, shippingCharge: true },
    }),
  ]);

  const globalRate = globalRecord
    ? (parseFloat(globalRecord.value) || 0)
    : 0;

  const effectiveRates = products.map((p) =>
    p.shippingCharge !== null ? Number(p.shippingCharge) : globalRate,
  );

  return effectiveRates.length > 0
    ? Math.max(...effectiveRates)
    : globalRate;
}
