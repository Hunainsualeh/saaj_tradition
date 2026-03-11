"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AnimatedHeadingText,
  Button,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import { PRODUCT_ACCORDION_ITEMS } from "@/lib";
import { useState } from "react";
import { ProductWithSizes } from "@/types/client";

type ProductPurchasePanelUIProps = {
  isLoading: boolean;
  isError: boolean;
  product: ProductWithSizes;
  defaultSize?: string;
  onAddToCart: (sizeId: string, sizeLabel: string) => Promise<void>;
};

export function ProductPurchasePanelUI(props: ProductPurchasePanelUIProps) {
  // === PROPS ===
  const {
    isLoading = false,
    isError = false,
    product,
    defaultSize = "",
    onAddToCart,
  } = props;

  // === STATE ===
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize);
  const [showSizeError, setShowSizeError] = useState<boolean>(false);

  // === FUNCTIONS ===
  const validateSizeSelection = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setShowSizeError(true);
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!validateSizeSelection()) {
      return;
    }

    await onAddToCart(
      selectedSize,
      product.sizes.find((size) => size.id === selectedSize)?.label || "",
    );
  };

  return (
    <div className="w-full lg:w-1/2 flex flex-col gap-8 lg:gap-10 lg:sticky lg:top-22 self-start">
      {/* Product title, price, description */}
      <div className="flex flex-col gap-2">
        <AnimatedHeadingText text={product.name} variant="product-page-title" />
        <div className="flex items-baseline gap-2 pb-2">
          <h4 className="text-xl md:text-2xl font-medium">
            Rs.{product.price.toFixed(2)}
          </h4>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-base text-neutral-8 line-through">
              Rs.{product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
        <p className="text-neutral-10 text-sm leading-relaxed">{product.description}</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Stock status */}
        {product.stockStatus === "OUT_OF_STOCK" && (
          <p className="text-sm text-neutral-9 border-l-2 border-neutral-4 pl-3">
            Currently out of stock
          </p>
        )}

        {product.stockStatus === "LOW_STOCK" && product.showLowStockWarning && (
          <p className="text-sm text-neutral-9 border-l-2 border-neutral-4 pl-3">
            {product.lowStockThreshold
              ? `Only ${product.lowStockThreshold} remaining`
              : "Low stock — order soon"}
          </p>
        )}

        {/* Size selector */}
        {product.sizes && product.sizes.length > 1 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="size-select"
                className="text-sm font-medium text-neutral-10"
              >
                Size
              </label>
              {showSizeError && (
                <span className="text-xs text-neutral-8">Please select a size</span>
              )}
            </div>

            <ToggleGroup
              id="size-select"
              type="single"
              onValueChange={(value) => {
                setSelectedSize(value);
                setShowSizeError(false);
              }}
              value={selectedSize}
            >
              {product.sizes.map((size) => {
                const available = size.stockTotal - size.stockReserved;
                const isOutOfStock = available <= 0;
                return (
                  <ToggleGroupItem
                    key={size.id}
                    value={size.id}
                    disabled={isOutOfStock}
                    className={isOutOfStock ? "opacity-35 line-through cursor-not-allowed" : ""}
                  >
                    {size.label?.toUpperCase()}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-xs text-neutral-8">
            Could not add to cart — please try again.
          </p>
        )}

        <Button
          text={"Add to Cart"}
          variant={"dark"}
          onClick={handleAddToCart}
          isLoading={isLoading}
          disabled={product.stockStatus === "OUT_OF_STOCK"}
          className={"w-full"}
        />
      </div>

      <Accordion collapsible type="single">
        {PRODUCT_ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger className="text-base" smallVariant>
              {item.trigger}
            </AccordionTrigger>
            <AccordionContent className="text-sm" smallVariant>
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
