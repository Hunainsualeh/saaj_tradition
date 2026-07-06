"use client";

import { useState } from "react";

import { DeliveryDetailsData } from "./schema";
import { OrderSummaryStepUI } from "./OrderSummaryStepUI";
import { CheckoutPaymentMethod } from "./PaymentStep";

type OrderSummaryStepProps = {
  deliveryData: DeliveryDetailsData | null;
  orderId: string;
  paymentMethod: CheckoutPaymentMethod;
};

export function OrderSummaryStep(props: OrderSummaryStepProps) {
  // === PROPS ===
  const { deliveryData, orderId, paymentMethod } = props;

  // === STATE ===
  // Only used to show the button spinner; the actual placement is a native form
  // POST to /api/checkout/place-order (see OrderSummaryStepUI) which the server
  // completes and 303-redirects. Doing the navigation server-side is what makes
  // checkout work on iOS Safari, where a scripted redirect after an awaited
  // server call is dropped once the tap's transient activation expires.
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <OrderSummaryStepUI
      isSubmitting={isSubmitting}
      onSubmit={() => setIsSubmitting(true)}
      orderId={orderId}
      paymentMethod={paymentMethod}
      delivery={deliveryData}
      buttonText={paymentMethod === "PAYFAST" ? "Pay via PayFast" : "Place Order"}
    />
  );
}
