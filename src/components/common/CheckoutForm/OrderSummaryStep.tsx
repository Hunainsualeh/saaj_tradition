"use client";

import { useState } from "react";
import { toast } from "sonner";

import { DeliveryDetailsData } from "./schema";
import {
  markOrderAsPaid,
  updateOrderDetails,
} from "@/lib/server/actions";
import { routes } from "@/lib";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === FUNCTIONS ===
  const handleConfirmPayment = async () => {
    if (!deliveryData) return;

    setIsSubmitting(true);

    try {
      // Save delivery details
      const updateResult = await updateOrderDetails(orderId, deliveryData);
      if (!updateResult.success) {
        toast.error(updateResult.error ?? "Failed to save delivery details");
        setIsSubmitting(false);
        return;
      }

      if (paymentMethod === "COD") {
        // Keep existing COD flow in this project.
        const paidResult = await markOrderAsPaid(orderId);
        if (!paidResult.success) {
          toast.error(paidResult.error ?? "Failed to place order");
          setIsSubmitting(false);
          return;
        }

        window.location.href = `${routes.checkoutSuccess}?orderId=${orderId}`;
        return;
      }

      // Use a server route that returns an auto-submitting PayFast form.
      window.location.href = `/api/payment/payfast/checkout?orderId=${encodeURIComponent(orderId)}`;
    } catch (err) {
      console.error("Error placing order:", err);
      toast.error("Unable to continue to payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <OrderSummaryStepUI
      isSubmitting={isSubmitting}
      onConfirmPayment={handleConfirmPayment}
      buttonText={paymentMethod === "PAYFAST" ? "Pay via PayFast" : "Place Order"}
    />
  );
}
