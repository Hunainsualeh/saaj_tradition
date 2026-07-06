"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useCartSidebar } from "@/providers";
import { useCartCount } from "@/providers";
import { cn, routes, MAX_CART_ITEM_QUANTITY } from "@/lib";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { getButtonStyles } from "@/components/ui/Button";
import { updateCartItemQuantity, removeCartItem } from "@/lib/server/actions";
import { CartItemWithDetails } from "@/types/client";

export function CartSidebar() {
  const { isOpen, cart, isLoading, closeSidebar, refreshCart } =
    useCartSidebar();
  const { setItemCount } = useCartCount();

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const items = cart?.items ?? [];
  const summary = cart?.summary ?? null;
  const isEmpty = items.length === 0 && !isLoading;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={closeSidebar}
        aria-hidden
      />

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-full max-w-[420px] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)]",
          "flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-6 border-b border-neutral-03 shrink-0">
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-neutral-12">
            Cart
            {summary && summary.itemCount > 0 && (
              <span className="ml-2 text-base font-normal text-neutral-08">
                ({summary.itemCount})
              </span>
            )}
          </h2>
          <button
            onClick={closeSidebar}
            className="p-2 -mr-2 rounded-full hover:bg-neutral-02 transition-colors cursor-pointer text-neutral-09 hover:text-neutral-12"
            aria-label="Close cart"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {isLoading && !cart ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-09" />
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <p className="text-lg font-medium text-neutral-12 mb-2">
                Your cart is empty
              </p>
              <p className="text-sm text-neutral-08 mb-6">
                Looks like you haven&apos;t added anything yet.
              </p>
              <Link
                href={routes.shop}
                onClick={closeSidebar}
                className={getButtonStyles("dark")}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-03">
              {items.map((item) => (
                <CartSidebarItem
                  key={item.id}
                  item={item}
                  onMutate={async (newCount: number) => {
                    setItemCount(newCount);
                    await refreshCart();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && summary && (
          <div className="border-t border-neutral-03 px-6 md:px-8 py-6 space-y-4 bg-white shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-base text-neutral-10 font-medium">Subtotal</span>
              <span className="text-xl font-medium text-neutral-12">
                {summary.subtotal}
              </span>
            </div>
            <p className="text-[13px] text-neutral-08 pt-1">
              Shipping & taxes calculated at checkout.
            </p>
            <div className="flex flex-col gap-3 pt-3">
              <Link
                href={routes.cart}
                onClick={closeSidebar}
                className={cn(
                  getButtonStyles("light"),
                  "w-full text-center py-3.5 text-[15px]",
                )}
              >
                View Cart
              </Link>
              <Link
                href={routes.checkout}
                onClick={closeSidebar}
                className={cn(
                  getButtonStyles("dark"),
                  "w-full text-center py-3.5 text-[15px]",
                )}
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// === SIDEBAR ITEM ===
function CartSidebarItem({
  item,
  onMutate,
}: {
  item: CartItemWithDetails;
  onMutate: (newCount: number) => Promise<void>;
}) {
  const [optimisticQty, setOptimisticQty] = useState(item.quantity);
  const [isBusy, setIsBusy] = useState(false);

  // Sync with prop when cart refreshes
  const [prevQty, setPrevQty] = useState(item.quantity);
  if (item.quantity !== prevQty) {
    setPrevQty(item.quantity);
    setOptimisticQty(item.quantity);
  }

  const unitPrice = Number(item.unitPrice);
  const lineTotal = (unitPrice * optimisticQty).toFixed(2);
  const productUrl = `${routes.product}/${item.slug}`;

  const updateQty = async (newQty: number) => {
    if (newQty < 1 || newQty > MAX_CART_ITEM_QUANTITY || isBusy) return;
    const prev = optimisticQty;
    setOptimisticQty(newQty);
    setIsBusy(true);
    try {
      const result = await updateCartItemQuantity({
        cartItemId: item.id,
        quantity: newQty,
      });
      if (result.success) {
        await onMutate(result.data.quantity);
      } else {
        setOptimisticQty(prev);
      }
    } catch {
      setOptimisticQty(prev);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemove = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const result = await removeCartItem({ cartItemId: item.id });
      if (result.success) {
        await onMutate(result.data.quantity);
      }
    } catch (err) {
      // Network-level failure: the item simply stays in the cart. `finally`
      // re-enables the row so the user can retry; log for observability.
      console.error("[CartSidebar] Failed to remove item:", err);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={cn("relative px-6 py-6 md:px-8", isBusy && "opacity-50")}>
      <div className="flex gap-5">
        {/* Image */}
        <Link
          href={productUrl}
          className="relative h-[110px] w-[85px] shrink-0 rounded-md overflow-hidden bg-neutral-02"
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            quality={60}
            className="object-cover"
            sizes="85px"
          />
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="pr-8">
            <Link
              href={productUrl}
              className="text-[15px] font-medium text-neutral-12 leading-tight line-clamp-2 hover:text-neutral-09 transition-colors"
            >
              {item.title}
            </Link>
            <p className="text-[13px] text-neutral-08 mt-1">
              {item.size.label}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            {/* Quantity Controls */}
            <div className="flex items-center h-9 border border-neutral-04 rounded-full overflow-hidden bg-white">
              <button
                onClick={() => updateQty(optimisticQty - 1)}
                disabled={isBusy || optimisticQty <= 1}
                className="w-9 h-full flex items-center justify-center hover:bg-neutral-02 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <MinusIcon className="w-3.5 h-3.5 text-neutral-10" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-neutral-11">
                {optimisticQty}
              </span>
              <button
                onClick={() => updateQty(optimisticQty + 1)}
                disabled={isBusy || optimisticQty >= MAX_CART_ITEM_QUANTITY}
                className="w-9 h-full flex items-center justify-center hover:bg-neutral-02 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                <PlusIcon className="w-3.5 h-3.5 text-neutral-10" />
              </button>
            </div>

            {/* Price */}
            <span className="text-[15px] font-medium text-neutral-12">
              Rs.{lineTotal}
            </span>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isBusy}
          className="absolute top-6 right-6 md:right-8 p-1.5 rounded-full hover:bg-neutral-02 transition-colors cursor-pointer disabled:opacity-30 text-neutral-08 hover:text-red-500"
          aria-label="Remove item"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
