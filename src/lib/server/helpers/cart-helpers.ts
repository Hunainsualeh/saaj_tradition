import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CartStatus } from "@prisma/client";
import { CACHE_TAG_CART } from "@/lib/constants/cache-tags";
import { cookies } from "next/headers";
import { COOKIE_CART_ID } from "@/lib/constants";

export const getCartCountCached = unstable_cache(
  async (cartId: string) => {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      select: { status: true },
    });

    if (!cart || cart.status === CartStatus.ORDERED) {
      return { quantity: 0, status: cart?.status ?? null };
    }

    const result = await prisma.cartItem.aggregate({
      where: { cartId },
      _sum: { quantity: true },
    });

    return { quantity: result._sum.quantity ?? 0, status: cart.status };
  },
  [CACHE_TAG_CART, "item-count"],
  {
    tags: [CACHE_TAG_CART],
  },
);

export function refreshCartCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  cartId: string,
) {
  cookieStore.set(COOKIE_CART_ID, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV === "production",
  });
}
