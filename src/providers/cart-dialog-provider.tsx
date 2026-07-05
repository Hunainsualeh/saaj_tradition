"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

// === TYPES ===
interface DialogProduct {
  productName: string;
  price: string;
  imageUrl: string;
  size?: string;
  category?: string;
  quantity?: number;
}

interface CartContextType {
  dialogOpen: boolean;
  dialogProduct: DialogProduct | null;
  showDialog: (product: DialogProduct) => void;
  hideDialog: () => void;
}

// === CONTEXT ===
const CartContext = createContext<CartContextType | undefined>(undefined);

// === PROVIDER ===
export const CartDialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProduct, setDialogProduct] = useState<DialogProduct | null>(
    null,
  );

  const showDialog = useCallback((product: DialogProduct) => {
    setDialogProduct(product);
    setDialogOpen(true);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogOpen(false);
    setDialogProduct(null);
  }, []);

  const value = useMemo(
    () => ({ dialogOpen, dialogProduct, showDialog, hideDialog }),
    [dialogOpen, dialogProduct, showDialog, hideDialog],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};

export const useCartDialog = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Return a safe no-op during SSR or when used outside the provider
    return {
      dialogOpen: false,
      dialogProduct: null,
      showDialog: () => {},
      hideDialog: () => {},
    } as CartContextType;
  }
  return context;
};
