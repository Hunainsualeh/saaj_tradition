"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

import { ServerActionResponse } from "@/types/server";

type CartItemCountResult = ServerActionResponse<{
  quantity: number;
}>;

type CartCountContextType = {
  itemCount: number;
  refreshCartCount: () => Promise<void>;
  setItemCount: React.Dispatch<React.SetStateAction<number>>;
};

const CartCountContext = createContext<CartCountContextType | undefined>(
  undefined,
);

export function CartCountProvider({
  children,
  fetchCartItemCount,
}: {
  children: ReactNode;
  fetchCartItemCount?: () => Promise<CartItemCountResult>;
}) {
  const [itemCount, setItemCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    if (!fetchCartItemCount) return;
    const result = await fetchCartItemCount();
    if (result.success) {
      setItemCount(result.data.quantity);
    }
  }, [fetchCartItemCount]);

  const value = useMemo(
    () => ({ itemCount, refreshCartCount, setItemCount }),
    [itemCount, refreshCartCount],
  );

  return (
    <CartCountContext.Provider value={value}>
      {children}
    </CartCountContext.Provider>
  );
}

export function useCartCount() {
  const context = useContext(CartCountContext);
  if (!context) {
    throw new Error("useCartCount must be used within CartCountProvider");
  }
  return context;
}
