import { redirect } from "next/navigation";

import { BaseSection, BreadCrumb } from "@/components";
import type { Metadata } from "next";
import { getCart } from "@/lib/server/queries";
import { getCompletedOrderSuccessPath } from "@/lib/server/queries/order-queries";
import { EmptyCart } from "@/components";
import { CartItemCard } from "@/components/common/CartItemCard/CartItemCard";
import { CartSummaryPanel } from "@/components/common/CartSummaryPanel/CartSummaryPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart",
};

export default async function CartPage() {
  // A just-completed order (cart cookie still present, order already PAID) is
  // sent to its confirmation instead of showing an empty cart.
  const completedPath = await getCompletedOrderSuccessPath();
  if (completedPath) {
    redirect(completedPath);
  }

  // === FETCHES ===
  const cartData = await getCart();

  // === ERROR HANDLING ===
  if (!cartData.success) {
    return (
      <main>
        <BaseSection id="cart-section" className="pb-16 md:pb-25">
          <div className="flex flex-col gap-6 pt-6 md:pt-10">
            <BreadCrumb items={[{ label: "Cart" }]} />
            <div className="text-center py-20">
              <p className="text-red-600 text-lg">
                Failed to load cart. Please try again later.
              </p>
            </div>
          </div>
        </BaseSection>
      </main>
    );
  }

  // === PREPARE DATA ===
  const { items, summary } = cartData.data;
  const cartItems = items.map((item) => ({
    ...item,
    unitPrice: Number(item.unitPrice),
  }));
  const isEmpty = cartItems.length === 0;

  return (
    <main>
      <BaseSection id="cart-section" className="pb-16 md:pb-25">
        <div className="flex flex-col gap-6 pt-6 md:pt-10">
          <h1 className="pb-2 md:pb-4 font-medium text-3xl md:text-4xl xl:text-5xl">
            Shopping Cart
          </h1>

          {isEmpty ? (
            <EmptyCart />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Cart Items Section */}
              <div className="w-full lg:w-[60%] flex flex-col gap-4">
                {cartItems.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>

              {/* Cart Summary Panel */}
              <CartSummaryPanel summary={summary} />
            </div>
          )}
        </div>
      </BaseSection>
    </main>
  );
}
