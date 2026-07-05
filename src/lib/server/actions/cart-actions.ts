"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";
import {
  COOKIE_CART_ID,
  MAX_CART_ITEM_QUANTITY,
  MAX_CART_TOTAL_QUANTITY,
} from "@/lib/constants";
import { COOKIE_COUPON_CODE } from "@/lib/constants/cookie-variables";
import { Decimal } from "@prisma/client/runtime/library";
import { CartQuantityReturn, FullCart } from "@/types/client";
import { ServerActionResponse } from "@/types/server";
import { wrapServerCall } from "../helpers/generic-helpers";
import { CartStatus, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { getCartCountCached, refreshCartCookie, invalidateCacheTag } from "../helpers";
import { CACHE_TAG_CART, CACHE_TAG_PRODUCT } from "@/lib/constants";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { getCart } from "@/lib/server/queries/cart-queries";
import { computeCartShipping } from "@/lib/server/actions/shipping-actions";
import { rateLimitCheckout } from "@/lib/rate-limit";

/**
 * Releases stock linked to carts that have been in CHECKOUT for >30 minutes
 * but never reached the ORDERED (paid) state.
 */
async function cleanupAbandonedCarts() {
  if (isDemoMode()) return;

  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  const abandonedCarts = await prisma.cart.findMany({
    where: {
      status: { not: CartStatus.ORDERED },
      reservedAt: { lt: thirtyMinsAgo },
    },
    include: { items: true },
  });

  if (abandonedCarts.length === 0) return;

  console.log(`[Scheduled Cleanup] Found ${abandonedCarts.length} abandoned cart(s). Releasing stock.`);

  let releasedAny = false;

  // Process each cart in its own transaction to avoid timeout with many carts
  for (const cart of abandonedCarts) {
    try {
      const released = await prisma.$transaction(async (tx) => {
        // Atomically CLAIM the release: only proceed if this cart still holds a
        // reservation. `updateMany` re-evaluates `reservedAt IS NOT NULL` after
        // acquiring the row lock, so under concurrency exactly one runner (this
        // path or the cron) wins — preventing double-decrement of stockReserved
        // (which would otherwise let the same stock be oversold).
        const claimed = await tx.cart.updateMany({
          where: { id: cart.id, reservedAt: { not: null } },
          data: {
            reservedAt: null,
            status: CartStatus.ACTIVE,
            abandonedAt: new Date(),
          },
        });

        if (claimed.count === 0) return false; // already released elsewhere

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
        return true;
      });

      if (released) releasedAny = true;
    } catch (error) {
      console.error(`[Scheduled Cleanup] Failed to release cart ${cart.id}:`, error);
    }
  }

  // Stock changed — invalidate product caches so listings/PDPs reflect it.
  // Awaited so any error surfaces to this function's caller (which .catch-es it)
  // rather than becoming an unhandled rejection in the fire-and-forget path.
  if (releasedAny) await invalidateCacheTag(CACHE_TAG_PRODUCT);
}

// === QUERIES ===
export async function getCartAction(): Promise<
  ServerActionResponse<FullCart>
> {
  return getCart();
}

export async function getCartItemCount(): Promise<
  ServerActionResponse<CartQuantityReturn>
> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();
    const existingCartId = cookieStore.get(COOKIE_CART_ID)?.value;

    if (!existingCartId) {
      return { quantity: 0 };
    }

    const { quantity, status } = await getCartCountCached(existingCartId);

    if (status === CartStatus.ORDERED) {
      cookieStore.delete(COOKIE_CART_ID);
      return { quantity: 0 };
    }

    return { quantity };
  });
}

// === SHARED VALIDATION HELPERS ===
function validateItemQuantityLimit(
  currentQuantity: number,
  quantityToAdd: number,
  itemIdentifier?: string,
): number {
  const newItemQuantity = currentQuantity + quantityToAdd;

  if (newItemQuantity > MAX_CART_ITEM_QUANTITY) {
    const identifier = itemIdentifier ? `${itemIdentifier} ` : "";
    throw new Error(
      `Cannot add ${quantityToAdd} more. ${identifier}is limited to ${MAX_CART_ITEM_QUANTITY} per cart. Currently have ${currentQuantity}.`,
    );
  }

  return newItemQuantity;
}

function validateCartTotalLimit(
  otherItemsTotal: number,
  newItemQuantity: number,
): number {
  const newCartTotal = otherItemsTotal + newItemQuantity;

  if (newCartTotal > MAX_CART_TOTAL_QUANTITY) {
    throw new Error(
      `Cart cannot exceed ${MAX_CART_TOTAL_QUANTITY} items total.`,
    );
  }

  return newCartTotal;
}

async function getOtherItemsTotal(
  tx: Prisma.TransactionClient,
  cartId: string,
  excludeItemId?: string,
  excludeProductAndSize?: { productId: string; sizeId: string },
): Promise<number> {
  const where: Prisma.CartItemWhereInput = { cartId };

  if (excludeItemId) {
    where.id = { not: excludeItemId };
  } else if (excludeProductAndSize) {
    where.NOT = {
      AND: {
        productId: excludeProductAndSize.productId,
        sizeId: excludeProductAndSize.sizeId,
      },
    };
  }

  const otherItems = await tx.cartItem.findMany({
    where,
    select: { quantity: true },
  });

  return otherItems.reduce((sum, item) => sum + item.quantity, 0);
}

// === MUTATIONS ===
export async function addToCart({
  productId,
  sizeId,
  quantity,
}: {
  productId: string;
  sizeId: string;
  quantity: number;
}): Promise<ServerActionResponse<CartQuantityReturn>> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();

    const existingCartId = cookieStore.get(COOKIE_CART_ID)?.value;
    const cartId = existingCartId ?? nanoid();

    // Validate input quantity
    if (quantity < 1 || quantity > MAX_CART_ITEM_QUANTITY) {
      throw new Error(
        `Quantity must be between 1 and ${MAX_CART_ITEM_QUANTITY}`,
      );
    }

    const cartQuantity = await prisma.$transaction(async (tx) => {
      const [size, cart] = await Promise.all([
        tx.size.findUnique({
          where: { id: sizeId },
          include: { product: true },
        }),
        // Fetch cart with all items in one query
        existingCartId
          ? tx.cart.findUnique({
              where: { id: existingCartId },
              include: {
                items: {
                  select: {
                    id: true,
                    productId: true,
                    sizeId: true,
                    quantity: true,
                  },
                },
              },
            })
          : null,
      ]);

      if (!size) {
        throw new Error("Size not found");
      }

      const product = size.product;

      if (!product.isActive) {
        throw new Error("This product is no longer available");
      }

      const existingItem = cart?.items.find(
        (item) => item.productId === productId && item.sizeId === sizeId,
      );
      const currentQuantity = existingItem?.quantity ?? 0;

      const otherItemsTotal =
        cart?.items
          .filter(
            (item) => !(item.productId === productId && item.sizeId === sizeId),
          )
          .reduce((sum, item) => sum + item.quantity, 0) ?? 0;

      const newItemQuantity = validateItemQuantityLimit(
        currentQuantity,
        quantity,
        product.name,
      );

      // Validate cart total
      const newCartTotal = validateCartTotalLimit(
        otherItemsTotal,
        newItemQuantity,
      );

      if (!cart) {
        await tx.cart.create({
          data: { id: cartId },
        });
      }

      // Update or create cart item
      await tx.cartItem.upsert({
        where: {
          cartId_productId_sizeId: {
            cartId: cartId,
            productId,
            sizeId: sizeId,
          },
        },
        update: {
          quantity: newItemQuantity,
        },
        create: {
          cartId: cartId,
          productId: product.id,
          sizeId,
          quantity,
          unitPrice: new Decimal(product.price),
          title: product.name,
          image: product.images[0],
        },
      });

      return newCartTotal;
    }, { timeout: 15000, maxWait: 5000 });

    refreshCartCookie(cookieStore, cartId);

    invalidateCacheTag(CACHE_TAG_CART);

    return { quantity: cartQuantity };
  });
}

export async function updateCartItemQuantity({
  cartItemId,
  quantity,
}: {
  cartItemId: string;
  quantity: number;
}): Promise<ServerActionResponse<CartQuantityReturn>> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();
    const existingCartId = cookieStore.get(COOKIE_CART_ID)?.value;

    if (!existingCartId) {
      throw new Error("Cart not found");
    }

    if (quantity < 1 || quantity > MAX_CART_ITEM_QUANTITY) {
      throw new Error(
        `Quantity must be between 1 and ${MAX_CART_ITEM_QUANTITY}`,
      );
    }

    const cartQuantity = await prisma.$transaction(async (tx) => {
      const [currentItem, otherItemsTotal] = await Promise.all([
        tx.cartItem.findUnique({
          where: { id: cartItemId },
          select: { quantity: true, cartId: true },
        }),
        getOtherItemsTotal(tx, existingCartId, cartItemId),
      ]);

      if (!currentItem || currentItem.cartId !== existingCartId) {
        throw new Error("Cart item not found");
      }

      const newCartTotal = await validateCartTotalLimit(
        otherItemsTotal,
        quantity,
      );

      await tx.cartItem.update({
        where: {
          id: cartItemId,
          cartId: existingCartId,
        },
        data: {
          quantity,
        },
      });

      return newCartTotal;
    }, { timeout: 15000, maxWait: 5000 });

    invalidateCacheTag(CACHE_TAG_CART);

    refreshCartCookie(cookieStore, existingCartId);

    return { quantity: cartQuantity };
  });
}

export async function removeCartItem({
  cartItemId,
}: {
  cartItemId: string;
}): Promise<ServerActionResponse<CartQuantityReturn>> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();
    const existingCartId = cookieStore.get(COOKIE_CART_ID)?.value;

    if (!existingCartId) {
      throw new Error("Cart not found");
    }

    const cartQuantity = await prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({
        where: {
          id: cartItemId,
          cartId: existingCartId, // Security check: ensure item belongs to user's cart
        },
      });

      const items = await tx.cartItem.findMany({
        where: { cartId: existingCartId },
        select: { quantity: true },
      });

      return items.reduce((sum, item) => sum + item.quantity, 0);
    }, { timeout: 15000, maxWait: 5000 });

    invalidateCacheTag(CACHE_TAG_CART);

    refreshCartCookie(cookieStore, existingCartId);

    return { quantity: cartQuantity };
  });
}

export async function initiateCheckout(
  status: CartStatus,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();
    const cartId = cookieStore.get(COOKIE_CART_ID)?.value;

    if (!cartId) throw new Error("Cart not found");

    // Rate limit: 5 checkout attempts per minute per cart
    const rl = await rateLimitCheckout(cartId);
    if (!rl.allowed) {
      throw new Error("Too many checkout attempts. Please wait a moment and try again.");
    }

    // Fire-and-forget: releasing stock from long-abandoned carts must NOT block
    // the customer's checkout request. The scheduled `cleanup-expired-carts`
    // cron is the authoritative cleanup path; this is only a best-effort nudge.
    void cleanupAbandonedCarts().catch((e) =>
      console.error("[Cleanup Error] Failed to cleanup abandoned carts", e),
    );
    const couponCode = cookieStore.get(COOKIE_COUPON_CODE)?.value;

    // === STEP 0: VALIDATE COUPON IF PRESENT ===
    let validCoupon: {
      code: string;
      discountPercent: number;
    } | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.maxUses || coupon.currentUses < coupon.maxUses)
      ) {
        validCoupon = {
          code: coupon.code,
          discountPercent: coupon.discountPercent,
        };
      }
    }

    // === STEP 0.5: COMPUTE SHIPPING CHARGE (global + per-product override) ===
    let shippingCharge = 0;
    const cartItemsForShipping = await prisma.cartItem.findMany({
      where: { cartId },
      select: { productId: true, unitPrice: true, quantity: true },
    });
    if (cartItemsForShipping.length > 0) {
      const productIds = cartItemsForShipping.map((i) => i.productId);
      shippingCharge = await computeCartShipping(productIds);
    }

    // === STEP 1: CHECK IF ORDER ALREADY EXISTS (outside transaction) ===
    const existingOrder = await prisma.order.findUnique({
      where: { cartId },
      select: { id: true, paymentSessionId: true, paymentStatus: true, totalPrice: true, updatedAt: true },
    });

    // If the previous payment attempt explicitly failed, or has been sitting
    // PENDING for >30 minutes (meaning PayFast's return URL was never called —
    // common in local dev), clear the stale session so we get a fresh token.
    if (
      existingOrder?.paymentSessionId &&
      (existingOrder.paymentStatus === "FAILED" ||
        (existingOrder.paymentStatus === "PENDING" &&
          existingOrder.updatedAt < new Date(Date.now() - 30 * 60 * 1000)))
    ) {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: { paymentSessionId: null },
      });
      // Treat it as if there's no paymentSessionId so the flow rebuilds below
      existingOrder.paymentSessionId = null;
    }

    if (existingOrder?.paymentSessionId) {
      // Check if total has changed (e.g. shipping rate was updated after order creation)
      const subtotal = cartItemsForShipping.reduce(
        (s, i) => s + i.unitPrice.toNumber() * i.quantity,
        0,
      );
      let discountAmt = 0;
      if (validCoupon) {
        discountAmt = (subtotal * validCoupon.discountPercent) / 100;
      }
      const newTotal = Math.max(subtotal - discountAmt + shippingCharge, 0);
      const existingTotal = existingOrder.totalPrice.toNumber();

      if (Math.abs(newTotal - existingTotal) > 0.001) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            totalPrice: new Decimal(newTotal),
            shippingAmount:
              shippingCharge > 0 ? new Decimal(shippingCharge) : null,
            ...(validCoupon
              ? {
                  couponCode: validCoupon.code,
                  discountPercent: validCoupon.discountPercent,
                  discountAmount: new Decimal(discountAmt),
                }
              : {}),
          },
        });
        invalidateCacheTag(CACHE_TAG_CART);
      }
      return;
    }

    // === STEP 2: Reserve stock and create order ===
    await prisma.$transaction(
      async (tx) => {
        // Fetch cart with items and sizes in one query
        const cart = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            items: {
              include: {
                size: {
                  select: {
                    id: true,
                    label: true,
                    stockTotal: true,
                    stockReserved: true,
                  },
                },
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw new Error("Cart empty");
        }

        if (cart.status === CartStatus.ORDERED) {
          cookieStore.delete(COOKIE_CART_ID);
          throw new Error("Cart has already been ordered");
        }

        // === ATOMIC STOCK RESERVATION ===
        // Only reserve if not already reserved
        if (!cart.reservedAt && !isDemoMode()) {
          for (const item of cart.items) {
            const updatedRows = await tx.$executeRawUnsafe(
              `UPDATE "Size" SET "stockReserved" = "stockReserved" + $1 WHERE "id" = $2 AND ("stockTotal" - "stockReserved") >= $1`,
              item.quantity,
              item.sizeId
            );
            if (updatedRows === 0) {
              throw new Error(`Not enough stock for ${item.title}`);
            }
          }
        }

        // Calculate total price
        const subtotal = cart.items.reduce(
          (sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
          0,
        );

        // Apply coupon discount (cap percent to [0,100])
        let discountAmount = 0;
        if (validCoupon) {
          const pct = Math.min(Math.max(validCoupon.discountPercent, 0), 100);
          discountAmount = (subtotal * pct) / 100;
        }
        let totalPrice = Math.max(subtotal - discountAmount + shippingCharge, 0);
        // round to nearest rupee before storing
        totalPrice = Math.round(totalPrice);

        // Update cart and create/return order atomically
        if (existingOrder) {
          // Order exists but no payment intent - just update cart and return existing order
          await tx.cart.update({
            where: { id: cartId },
            data: {
              status,
              reservedAt: isDemoMode() ? null : (cart.reservedAt ?? new Date()),
            },
          });

          // Update coupon info on existing order
          if (validCoupon) {
            await tx.order.update({
              where: { id: existingOrder.id },
              data: {
                couponCode: validCoupon.code,
                discountPercent: Math.min(Math.max(validCoupon.discountPercent, 0), 100),
                discountAmount: new Decimal(discountAmount),
                shippingAmount: shippingCharge > 0 ? new Decimal(shippingCharge) : null,
                totalPrice: new Decimal(totalPrice),
              },
            });
          } else {
            await tx.order.update({
              where: { id: existingOrder.id },
              data: {
                shippingAmount: shippingCharge > 0 ? new Decimal(shippingCharge) : null,
                totalPrice: new Decimal(totalPrice),
              },
            });
          }

          return { id: existingOrder.id, totalPrice: new Decimal(totalPrice) };
        } else {
          // Create order, order items, and update cart atomically
          const [newOrder] = await Promise.all([
            tx.order.create({
              data: {
                cartId,
                totalPrice,
                trackingToken: nanoid(32),
                shippingAmount: shippingCharge > 0 ? new Decimal(shippingCharge) : null,
                status: OrderStatus.PENDING,
                paymentMethod: PaymentMethod.COD,
                ...(validCoupon
                  ? {
                      couponCode: validCoupon.code,
                      discountPercent: validCoupon.discountPercent,
                      discountAmount: new Decimal(discountAmount),
                    }
                  : {}),
                // Snapshot cart items so order history survives cart cleanup
                orderItems: {
                  create: cart.items.map((item) => ({
                    productId: item.productId,
                    sizeId: item.sizeId,
                    title: item.title,
                    image: item.image,
                    sizeLabel: item.size.label,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                  })),
                },
              },
              select: { id: true, totalPrice: true },
            }),
            tx.cart.update({
              where: { id: cartId },
              data: {
                status,
                reservedAt: isDemoMode()
                  ? null
                  : (cart.reservedAt ?? new Date()),
              },
            }),
          ]);
          return newOrder;
        }
      },
      { timeout: 15000, maxWait: 5000 },
    );

    invalidateCacheTag(CACHE_TAG_CART);
    invalidateCacheTag(CACHE_TAG_PRODUCT);
  });
}

// === CLEAR CART ===
export async function clearCart(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_CART_ID);
  invalidateCacheTag(CACHE_TAG_CART);
}
