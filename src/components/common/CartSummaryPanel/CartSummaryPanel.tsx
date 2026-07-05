import { cookies } from "next/headers";
import { CartSummary } from "@/types/client";
import { CheckoutButton } from "@/components/common/CheckoutButton/CheckoutButton";
import { CouponInput } from "@/components/common/CouponInput/CouponInput";
import { CartSummaryPanelUI } from "./CartSummaryPanelUI";
import { validateCouponCode } from "@/lib/server/queries";
import { COOKIE_COUPON_CODE } from "@/lib/constants/cookie-variables";

type CartSummaryPanelProps = {
  summary: CartSummary;
};

export async function CartSummaryPanel(props: CartSummaryPanelProps) {
  // === PROPS ===
  const { summary } = props;

  // === COUPON ===
  const cookieStore = await cookies();
  const couponCode = cookieStore.get(COOKIE_COUPON_CODE)?.value;

  let appliedCoupon: { code: string; discountPercent: number } | null = null;
  let discount: { code: string; percent: number; amount: string } | null = null;
  let discountedTotalValue: string | undefined = undefined;

  if (couponCode) {
    const validation = await validateCouponCode(couponCode);
    if (validation.success && validation.data?.valid && validation.data.discountPercent) {
      const percent = validation.data.discountPercent;
      const subtotalNum = parseFloat(summary.subtotal.replace(/[^0-9.]/g, ""));
      const shippingNum = summary.shipping === "Free"
        ? 0
        : parseFloat(summary.shipping.replace(/[^0-9.]/g, ""));
      const discountAmount = (subtotalNum * percent) / 100;
      const discountedTotal = Math.max(subtotalNum - discountAmount + shippingNum, 0);

      appliedCoupon = { code: couponCode, discountPercent: percent };
      discount = {
        code: couponCode,
        percent,
        amount: `Rs.${discountAmount.toFixed(2)}`,
      };
      discountedTotalValue = `Rs.${discountedTotal.toFixed(2)}`;
    }
  }

  const resolvedSummary: CartSummary = discountedTotalValue
    ? { ...summary, discountedTotal: discountedTotalValue }
    : summary;

  return (
    <CartSummaryPanelUI
      summary={resolvedSummary}
      checkoutButton={<CheckoutButton className="w-full" />}
      couponInput={<CouponInput appliedCoupon={appliedCoupon} />}
      discount={discount}
    />
  );
}
