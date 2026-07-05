"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

import { FullCart } from "@/types/client";
import { ServerActionResponse } from "@/types/server";

type CartSidebarContextType = {
  isOpen: boolean;
  cart: FullCart | null;
  isLoading: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  refreshCart: () => Promise<void>;
};

const CartSidebarContext = createContext<CartSidebarContextType | undefined>(
  undefined,
);

export function CartSidebarProvider({
  children,
  fetchCart,
}: {
  children: ReactNode;
  fetchCart: () => Promise<ServerActionResponse<FullCart>>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<FullCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchCart();
      if (result.success) {
        setCart(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchCart]);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
    refreshCart();
  }, [refreshCart]);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, cart, isLoading, openSidebar, closeSidebar, refreshCart }),
    [isOpen, cart, isLoading, openSidebar, closeSidebar, refreshCart],
  );

  return (
    <CartSidebarContext.Provider value={value}>
      {children}
    </CartSidebarContext.Provider>
  );
}

export function useCartSidebar() {
  const context = useContext(CartSidebarContext);
  if (!context) {
    throw new Error(
      "useCartSidebar must be used within CartSidebarProvider",
    );
  }
  return context;
}
