import { CartItemWithDetails, CartSummary } from "@/types/client";
import { CheckoutCartItem } from "../CheckoutCartItem/CheckoutCartItem";
import { calculateMockArrivalDate } from "@/lib/utils";

type CheckoutCartSidebarProps = {
  items: CartItemWithDetails[];
  summary: CartSummary;
  discount?: {
    code: string;
    percent: number;
    amount: string;
  } | null;
  shippingAmount?: number;
};

export function CheckoutCartSidebar(props: CheckoutCartSidebarProps) {
  // === PROPS ===
  const { items, summary, discount, shippingAmount } = props;

  const shippingDisplay =
    shippingAmount && shippingAmount > 0
      ? `Rs.${Math.round(shippingAmount)}`
      : "Free";

  return (
    <div className="w-full self-start">
      <div className="border border-neutral-5 rounded-sm p-6">
        <div className="flex flex-col gap-y-2 mb-4">
          <h2 className="text-xl font-medium text-neutral-12 ">
            Order Summary
          </h2>
          <span className="text-base text-neutral-10">
            Arrives {calculateMockArrivalDate()}
          </span>
        </div>

        {/* Cart Items */}
        <div className="mb-6">
          {items.map((item) => (
            <CheckoutCartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Summary Section */}
        <div className="space-y-4 pt-4 border-t border-neutral-5">
          <div className="flex justify-between text-base">
            <span className="text-neutral-10">Subtotal</span>
            <span className="text-neutral-12">{summary.subtotal}</span>
          </div>

          {discount && (
            <div className="flex justify-between text-base text-green-700">
              <span>Discount ({discount.code})</span>
              <span>-{discount.amount}</span>
            </div>
          )}

          <div className="flex justify-between text-base">
            <span className="text-neutral-10">Shipping</span>
            <span className="text-neutral-12">{shippingDisplay}</span>
          </div>

          <div className="border-t border-neutral-5 pt-4">
            <div className="flex justify-between text-lg">
              <span className="text-neutral-12 font-medium text-lg">Total</span>
              <span className="text-neutral-12 font-medium text-lg">
                {discount ? summary.discountedTotal || summary.total : summary.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
