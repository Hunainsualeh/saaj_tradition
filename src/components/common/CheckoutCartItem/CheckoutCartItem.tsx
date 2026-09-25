import Image from "next/image";

import { CartItemWithDetails } from "@/types/client";

type CheckoutCartItemProps = {
  item: CartItemWithDetails;
};

export function CheckoutCartItem(props: CheckoutCartItemProps) {
  const { item } = props;

  const itemTotal = (Number(item.unitPrice) * item.quantity).toFixed(2);

  return (
    <div className="flex gap-4 py-4 border-b border-neutral-04 last:border-b-0">
      {/* Product Image */}
      <div className="relative h-22 w-22 bg-neutral-3 rounded-md overflow-hidden shrink-0">
        <Image
          src={item.image}
          alt={item.title}
          quality={60}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <h3 className="text-base font-medium text-neutral-12 truncate">
          {item.title}
        </h3>
        <p className="text-sm text-neutral-10">Size: {item.size.label}</p>
        <p className="text-sm text-neutral-10">Quantity: {item.quantity}</p>
      </div>

      {/* Price */}
      <div className="text-base font-medium text-neutral-12 shrink-0">
        Rs.{itemTotal}
      </div>
    </div>
  );
}
