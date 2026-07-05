"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { CouponMutationInput, ServerActionResponse } from "@/types/server";
import { CouponValidationResult } from "@/types/server/coupon";
import {
  AdminCouponFormData,
} from "@/components/admin/forms/AdminCouponsForm/schema";
import { adminRoutes } from "@/lib/routing";
import { wrapServerCall } from "../helpers/generic-helpers";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { requireAdmin } from "@/lib/server/helpers/require-admin";
import { validateCouponCode } from "@/lib/server/queries";
import { COOKIE_CART_ID, COOKIE_COUPON_CODE } from "@/lib/constants/cookie-variables";
import { CACHE_TAG_CART, CACHE_TAG_COUPON } from "@/lib/constants/cache-tags";
import { rateLimitCoupon } from "@/lib/rate-limit";

export async function deleteCouponById(
  id: string,
): Promise<ServerActionResponse<CouponMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }
    const deleted = await prisma.coupon.delete({ where: { id } });
    invalidateCacheTag(CACHE_TAG_COUPON);
    revalidatePath(adminRoutes.coupons);
    return { id: deleted.id };
  });
}

export async function createCoupon(
  data: AdminCouponFormData,
): Promise<ServerActionResponse<CouponMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id: `demo-${data.code}` };
    }
    const created = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountPercent: data.discountPercent,
        maxUses: data.maxUses || null,
        isActive: data.isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    invalidateCacheTag(CACHE_TAG_COUPON);
    revalidatePath(adminRoutes.coupons);
    return { id: created.id };
  });
}

export async function updateCouponById(
  id: string,
  data: AdminCouponFormData,
): Promise<ServerActionResponse<CouponMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }
    await prisma.coupon.update({
      where: { id },
      data: {
        code: data.code.toUpperCase(),
        discountPercent: data.discountPercent,
        maxUses: data.maxUses || null,
        isActive: data.isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    invalidateCacheTag(CACHE_TAG_COUPON);
    revalidatePath(adminRoutes.coupons);
    return { id };
  });
}

export async function incrementCouponUsage(
  code: string,
): Promise<ServerActionResponse<{ success: boolean }>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    await prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: {
        currentUses: { increment: 1 },
      },
    });
    return { success: true };
  });
}

// === CUSTOMER-FACING COUPON ACTIONS ===

export async function applyCouponCode(
  code: string,
): Promise<ServerActionResponse<CouponValidationResult>> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();

    // Rate limit: 10 coupon attempts per minute, keyed by CART (falling back to
    // client IP). Keying by cart/IP — not by `code` — prevents (a) unlimited
    // coupon-code enumeration by simply varying the code each attempt, and
    // (b) a shared popular code (e.g. "SALE20") exhausting one global bucket and
    // falsely rate-limiting every legitimate customer.
    const cartId = cookieStore.get(COOKIE_CART_ID)?.value;
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const rl = await rateLimitCoupon(cartId ?? `ip:${ip}`);
    if (!rl.allowed) {
      return { valid: false, discountPercent: 0, code: "", message: "Too many attempts. Please try again later." };
    }

    const result = await validateCouponCode(code);

    if (!result.success) {
      return { valid: false, discountPercent: 0, code: "", message: "Invalid coupon code" };
    }

    if (!result.data.valid) {
      return result.data;
    }

    cookieStore.set(COOKIE_COUPON_CODE, code.toUpperCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    invalidateCacheTag(CACHE_TAG_CART);

    return result.data;
  });
}

export async function removeCouponCode(): Promise<
  ServerActionResponse<void>
> {
  return wrapServerCall(async () => {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_COUPON_CODE);
    invalidateCacheTag(CACHE_TAG_CART);
  });
}
