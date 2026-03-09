import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CartStatus } from "@prisma/client";

import { ServerActionResponse } from "@/types/server";
import { CartItemWithDetails, CartSummary, FullCart } from "@/types/client";
import { wrapServerCall } from "../helpers";
import { COOKIE_CART_ID } from "@/lib/constants";

// === QUERIES ===
export async function getCart(): Promise<ServerActionResponse<FullCart>> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();
    const existingCartId = cookieStore.get(COOKIE_CART_ID)?.value;

    if (!existingCartId) {
      return {
        items: [],
        summary: {
          subtotal: "Rs.0.00",
          shipping: "Free",
          total: "Rs.0.00",
          itemCount: 0,
        },
      };
    }

    // Check cart status before proceeding
    const cart = await prisma.cart.findUnique({
      where: { id: existingCartId },
      select: { status: true },
    });

    // If cart is ORDERED (paid) or not found, return empty cart
    // Note: cookie deletion must happen in a Server Action — not here (read-only during render)
    if (!cart || cart.status === CartStatus.ORDERED) {
      return {
        items: [],
        summary: {
          subtotal: "Rs.0.00",
          shipping: "Free",
          total: "Rs.0.00",
          itemCount: 0,
        },
      };
    }

    const [cartItems, globalRateRecord] = await Promise.all([
      prisma.cartItem.findMany({
        where: { cartId: existingCartId },
        include: {
          size: {
            select: {
              id: true,
              label: true,
            },
          },
          product: {
            select: {
              slug: true,
              shippingCharge: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.siteContent.findUnique({ where: { key: "shipping_charge" } }),
    ]);

    const globalRate = globalRateRecord
      ? (parseFloat(globalRateRecord.value) || 0)
      : 0;

    const items: CartItemWithDetails[] = cartItems.map((item) => ({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      sizeId: item.sizeId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      title: item.title,
      image: item.image,
      size: item.size,
      slug: item.product.slug,
    }));

    // Calculate subtotal
    const subtotalDecimal = items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return sum + itemTotal;
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // === SHIPPING CALCULATION ===
    // Each product uses its own charge if set, otherwise the global rate.
    // The cart shipping = highest applicable rate across all items.
    let shippingAmount = 0;
    if (cartItems.length > 0) {
      const effectiveRates = cartItems.map((item) =>
        item.product.shippingCharge !== null
          ? Number(item.product.shippingCharge)
          : globalRate,
      );
      shippingAmount = Math.max(...effectiveRates);
    }

    const shippingDisplay =
      shippingAmount > 0 ? `Rs.${Math.round(shippingAmount)}` : "Free";

    const summary: CartSummary = {
      subtotal: `Rs.${Math.round(subtotalDecimal)}`,
      shipping: shippingDisplay,
      total: `Rs.${Math.round(subtotalDecimal + shippingAmount)}`,
      itemCount,
    };

    return {
      items,
      summary,
    };
  });
}

