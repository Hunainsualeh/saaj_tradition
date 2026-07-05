import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ServerActionResponse, CouponValidationResult } from "@/types/server";
import { CouponItem } from "@/types/client";
import { Coupon } from "@prisma/client";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_COUPON } from "@/lib/constants/cache-tags";

const getCouponsCached = unstable_cache(
  async () =>
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    }),
  [CACHE_TAG_COUPON, "all"],
  { tags: [CACHE_TAG_COUPON] },
);

export async function getCoupons(): Promise<
  ServerActionResponse<CouponItem[]>
> {
  return wrapServerCall(() => getCouponsCached());
}

export async function getCouponById(
  id: string,
): Promise<ServerActionResponse<Coupon | null>> {
  return wrapServerCall(() =>
    prisma.coupon.findUnique({
      where: { id },
    }),
  );
}

export async function validateCouponCode(
  code: string,
): Promise<ServerActionResponse<CouponValidationResult>> {
  return wrapServerCall(async () => {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return {
        valid: false,
        discountPercent: 0,
        code,
        message: "Invalid coupon code",
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        discountPercent: 0,
        code,
        message: "This coupon is no longer active",
      };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return {
        valid: false,
        discountPercent: 0,
        code,
        message: "This coupon has expired",
      };
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return {
        valid: false,
        discountPercent: 0,
        code,
        message: "This coupon has reached its usage limit",
      };
    }

    return {
      valid: true,
      discountPercent: coupon.discountPercent,
      code: coupon.code,
      message: `${coupon.discountPercent}% discount applied!`,
    };
  });
}
