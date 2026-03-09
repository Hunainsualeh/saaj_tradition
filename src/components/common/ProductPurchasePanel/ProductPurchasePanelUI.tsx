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
        <p className="text-neutral-10 text-sm">{product.description}</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* OUT OF STOCK WARNING */}
        {product.stockStatus === "OUT_OF_STOCK" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
            <div className="text-red-600 fill-current flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM9 4h2v11H9V4zm0 12h2v2H9v-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-red-900">Out of Stock</h4>
              <p className="text-xs text-red-800 mt-1">This product is currently unavailable.</p>
            </div>
          </div>
        )}

        {/* LOW STOCK WARNING */}
        {product.stockStatus === "LOW_STOCK" && product.showLowStockWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
            <div className="text-yellow-600 fill-current flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM9 4h2v11H9V4zm0 12h2v2H9v-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-yellow-900">Limited Stock</h4>
              <p className="text-xs text-yellow-800 mt-1">
                {product.lowStockThreshold
                  ? `Only ${product.lowStockThreshold} left in stock`
                  : "Limited quantity available"}
              </p>
            </div>
          </div>
        )}

        {product.sizes && product.sizes.length > 1 && (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="size-select"
              className="text-sm font-semibold text-neutral-10"
            >
              Select Size
            </label>

            {showSizeError && (
              <p className="text-red-500 text-sm">Please select a size</p>
            )}

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
                    className={isOutOfStock ? "opacity-40 line-through cursor-not-allowed" : ""}
                  >
                    {size.label?.toUpperCase()}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>
        )}

        {isError && (
          <p className="text-red-500 text-sm">
            An error occurred while adding the product to the cart. Please try
            again.
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
