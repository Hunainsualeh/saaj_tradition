"use client";

import { useState } from "react";

import { useCartCount, useCartDialog } from "@/providers";
import { ProductWithSizes } from "@/types/client";
import { ProductPurchasePanelUI } from "./ProductPurchasePanelUI";
import { addToCart } from "@/lib/server/actions";

type ProductPurchasePanelProps = {
  product: ProductWithSizes;
  defaultSize?: string;
};

export function ProductPurchasePanel(props: ProductPurchasePanelProps) {
  // === PROPS ===
  const { product, defaultSize } = props;

  // === STATE ===
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // === CONTEXT ===
  const { showDialog } = useCartDialog();
  const { setItemCount } = useCartCount();

  // === FUNCTIONS ===
  const handleAddToCart = async (sizeId: string, sizeLabel: string) => {
    setIsLoading(true);

    try {
      const result = await addToCart({
        productId: product.id,
        sizeId,
        quantity: 1,
      });

      if (!result.success) {
        setIsError(true);
        return;
      }

      // Update cart count directly from the response instead of a separate server call
      setItemCount(result.data.quantity);

      showDialog({
        productName: product.name,
        price: product.price.toString(),
        imageUrl: product.images[0],
        size: sizeLabel,
        category: product.categories?.[0]?.name ?? "Uncategorized",
        quantity: result.data.quantity,
      });
      setIsError(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductPurchasePanelUI
      isLoading={isLoading}
      isError={isError}
      product={product}
      onAddToCart={handleAddToCart}
      defaultSize={defaultSize}
    />
  );
}
