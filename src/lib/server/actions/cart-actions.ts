"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
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
import { getCartCountCached, refreshCartCookie } from "../helpers";
import { CACHE_TAG_CART, CACHE_TAG_PRODUCT } from "@/lib/constants";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { getCart } from "@/lib/server/queries/cart-queries";
import { computeCartShipping } from "@/lib/server/actions/shipping-actions";

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
    });

    refreshCartCookie(cookieStore, cartId);

    updateTag(CACHE_TAG_CART);

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
    });

    updateTag(CACHE_TAG_CART);

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
    });

    updateTag(CACHE_TAG_CART);

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
    const couponCode = cookieStore.get(COOKIE_COUPON_CODE)?.value;

    if (!cartId) throw new Error("Cart not found");

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
      select: { id: true, paymentSessionId: true, totalPrice: true },
    });

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
        updateTag(CACHE_TAG_CART);
      }
      return;
    }

    // === STEP 2: Reserve stock and create order ===
    const order = await prisma.$transaction(
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
          // Pre-validate stock availability
          for (const item of cart.items) {
            const available = item.size.stockTotal - item.size.stockReserved;
            if (available < item.quantity) {
              throw new Error(`Not enough stock for ${item.title}`);
            }
          }

          await Promise.all(
            cart.items.map((item) =>
              tx.size.update({
                where: { id: item.sizeId },
                data: {
                  stockReserved: {
                    increment: item.quantity,
                  },
                },
              }),
            ),
          );
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
          // Create order and update cart in parallel
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
      { timeout: 6500 }, // TO DO: IMPROVE PERFORMANCE TO AVOID LONG TRANSACTIONS
    );

    // Persist a payment session marker used by the hosted PayFast handoff.
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentSessionId: `payfast_${order.id}`,
      },
    });

    updateTag(CACHE_TAG_CART);
    updateTag(CACHE_TAG_PRODUCT);
  });
}

// === CLEAR CART ===
export async function clearCart(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_CART_ID);
  updateTag(CACHE_TAG_CART);
}
