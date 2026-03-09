"use client";

import { useEffect, useRef } from "react";
import { useCartCount } from "@/providers";
import { clearCart } from "@/lib/server/actions";
import { CheckoutSuccessUI } from "./CheckoutSuccessUI";
import { OrderSuccessData } from "@/lib/server/queries/order-queries";

type CheckoutSuccessProps = {
  order: OrderSuccessData;
};

export function CheckoutSuccess({ order }: CheckoutSuccessProps) {
  const { refreshCartCount } = useCartCount();

  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    clearCart();
    refreshCartCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <CheckoutSuccessUI order={order} />;
}
