import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Decimal } from "@prisma/client/runtime/library";

import { BaseSection } from "@/components";
import { getCart } from "@/lib/server/queries/cart-queries";
import { CheckoutCartSidebar } from "@/components";
import { getCurrentOrder } from "@/lib/server/actions";
import { getCompletedOrderSuccessPath } from "@/lib/server/queries/order-queries";
import { CheckoutForm } from "@/components/common/CheckoutForm/CheckoutForm";
import { computeCartShipping } from "@/lib/server/actions/shipping-actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; orderId?: string }>;
}) {
  const { payment } = await searchParams;
  const paymentFailed = payment === "failed";

  // === REDIRECT A JUST-COMPLETED ORDER TO ITS SUCCESS PAGE ===
  // getCurrentOrder() intentionally returns null once an order is PAID, so
  // without this a customer who placed a COD order but didn't complete the
  // client-side hop to /checkout/success (slow/dropped response, refresh, back)
  // would fall through to the "empty cart" redirect below and re-order. Send
  // them to their confirmation instead. Must run before the /cart redirect.
  const completedPath = await getCompletedOrderSuccessPath();
  if (completedPath) {
    redirect(completedPath);
  }

  // === FETCH DATA ===
  const cartResult = await getCart();
  const orderResult = await getCurrentOrder();

  // === REDIRECT IF NO CART/ORDER ===
  if (
    !orderResult.success ||
    !orderResult.data ||
    !cartResult.success ||
    cartResult.data.items.length === 0
  ) {
    redirect("/cart");
  }

  const order = orderResult.data;

  // === PREPARE DATA ===
  const { items, summary } = cartResult.data;
  const { id: orderId } = order;

  // === RECONCILE SHIPPING ===
  // getCart() already computes the latest shipping from DB.
  // But the order total may be stale if admin changed
  // the shipping rate after the order was created. Reconcile here.
  const productIds = items.map((item) => item.productId);
  const latestShipping =
    productIds.length > 0 ? await computeCartShipping(productIds) : 0;

  // calculate subtotal directly from items (avoid parsing summary string)
  const subtotalNum = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmt = order.discountAmount ? Number(order.discountAmount) : 0;
  const expectedTotal = Math.max(subtotalNum - discountAmt + latestShipping, 0);
  const currentOrderTotal = Number(order.totalPrice);

  // if order record is out-of-sync, update it using the freshly computed value
  if (Math.abs(expectedTotal - currentOrderTotal) > 0.001) {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          shippingAmount:
            latestShipping > 0 ? new Decimal(latestShipping) : null,
          totalPrice: new Decimal(expectedTotal),
        },
      });
    } catch (e) {
      console.error("Failed to reconcile shipping on checkout:", e);
    }
  }

  // orderTotal always comes from expectedTotal now (trust cart data)
  const shippingAmount = latestShipping;
  const orderTotal = expectedTotal;

  // COUPON INFO (discountAmt already computed)
  let discount: { code: string; percent: number; amount: string } | null = null;

  if (order.couponCode && order.discountPercent && order.discountAmount) {
    discount = {
      code: order.couponCode,
      percent: order.discountPercent,
      amount: `Rs.${discountAmt.toFixed(2)}`,
    };
    summary.discountedTotal = `Rs.${orderTotal.toFixed(2)}`;
  }

  // SHIPPING & TOTAL DISPLAY
  // round display values to whole rupees
  summary.subtotal = `Rs.${Math.round(subtotalNum)}`; // ensure displayed matches calculation
  summary.shipping =
    shippingAmount > 0 ? `Rs.${Math.round(shippingAmount)}` : "Free";
  summary.total = `Rs.${Math.round(orderTotal)}`;

  return (
    <main>
      <BaseSection id="checkout-section" className="pb-16 md:pb-25">
        <div className="flex flex-col gap-6 pt-6 md:pt-10">
          <h1 className="pb-2 md:self-center md:pb-4 font-medium text-3xl">
            Checkout
          </h1>

          {/* Mobile: Cart above, Desktop: Side-by-side */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* Cart shown above on mobile only */}
            <div className="md:hidden">
              <CheckoutCartSidebar
                items={items}
                summary={summary}
                discount={discount}
                shippingAmount={shippingAmount}
              />
            </div>

            {/* Form */}
            <div className="w-full md:w-[60%]">
              <CheckoutForm
                orderId={orderId}
                paymentFailed={paymentFailed}
                prefillDelivery={
                  paymentFailed && order.delieveryName
                    ? {
                        fullName: order.delieveryName ?? "",
                        email: order.deliveryEmail ?? "",
                        phone: order.deliveryPhone ?? "",
                        address: order.deliveryStreetAddress ?? "",
                        city: order.deliveryCity ?? "",
                        state: order.deliveryState ?? "",
                        zipCode: order.deliveryPostcode ?? "",
                        country: order.deliveryCountry ?? "Pakistan",
                        useSameBillingAddress: true,
                      }
                    : null
                }
              />
            </div>

            {/* Cart sidebar on desktop */}
            <div className="hidden md:block w-full md:w-[40%]">
              <CheckoutCartSidebar
                items={items}
                summary={summary}
                discount={discount}
                shippingAmount={shippingAmount}
              />
            </div>
          </div>
        </div>
      </BaseSection>
    </main>
  );
}
