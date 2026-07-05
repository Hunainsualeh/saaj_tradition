"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { CircleCheckIcon } from "@/components/icons";
import { getButtonStyles } from "@/components/ui/Button";
import { ONE_SIZE_LABEL } from "@/lib";

type AddToCartDialogUIProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  price: string;
  imageUrl: string;
  size?: string;
  category?: string;
  quantity?: number;
  onViewCart?: () => void;
  checkoutButton: ReactNode;
};

export function AddToCartDialogUI(props: AddToCartDialogUIProps) {
  // === PROPS ===
  const {
    open,
    onOpenChange,
    productName,
    price,
    imageUrl,
    size,
    category,
    quantity,
    onViewCart,
    checkoutButton,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <CircleCheckIcon />
            <DialogTitle>Added to Cart</DialogTitle>
            <DialogDescription className="sr-only">
              Item successfully added to your cart.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* PRODUCT TILE */}
          <div className="flex gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-sm bg-neutral-02">
              <Image
                src={imageUrl}
                alt={productName}
                fill
                quality={60}
                className="object-cover"
                sizes="112px"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <h4 className="text-lg line-clamp-2">{productName}</h4>
              {category && (
                <p className="text-sm text-neutral-10">{category}</p>
              )}
              <div className="flex flex-col gap-0.5 text-sm text-neutral-10">
                {size && (
                  <p>{size === ONE_SIZE_LABEL ? size : `Size ${size}`}</p>
                )}
              </div>
              <p className="mt-auto text-base text-neutral-10">Rs.{price}</p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2.5">
            {onViewCart ? (
              <button
                onClick={onViewCart}
                className={getButtonStyles("light")}
              >
                View Cart{quantity ? ` (${quantity})` : ""}
              </button>
            ) : (
              <Link
                href="/cart"
                className={getButtonStyles("light")}
                onClick={() => onOpenChange(false)}
              >
                View Cart{quantity ? ` (${quantity})` : ""}
              </Link>
            )}

            {checkoutButton}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
