"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui";
import { cn } from "@/lib";

export type CheckoutPaymentMethod = "PAYFAST" | "COD";

type PaymentStepProps = {
  onContinue: (paymentMethod: CheckoutPaymentMethod) => void;
  onEditPaymentRequest: () => void;
  completed: boolean;
  selectedMethod: CheckoutPaymentMethod;
};

export function PaymentStep(props: PaymentStepProps) {
  // === PROPS ===
  const { onContinue, onEditPaymentRequest, completed, selectedMethod } = props;
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>(
    selectedMethod,
  );

  const paymentMethodLabel =
    paymentMethod === "PAYFAST" ? "PayFast (Card / JazzCash / EasyPaisa)" : "Cash on Delivery";

  return (
    <div className="space-y-4">
      {/* Completed summary */}
      <motion.div
        animate={{ opacity: completed ? 1 : 0, height: completed ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-neutral-02 overflow-hidden flex border border-neutral-5 rounded-md justify-between items-start"
      >
        <div className="space-y-1 text-sm text-neutral-10 p-4">
          <p>Payment Method: {selectedMethod === "PAYFAST" ? "PayFast" : "Cash on Delivery"}</p>
        </div>
        <button
          onClick={onEditPaymentRequest}
          className="text-sm p-4 text-neutral-12 cursor-pointer font-medium underline"
        >
          Edit
        </button>
      </motion.div>

      {/* Payment form */}
      <motion.div
        className={cn(
          "overflow-hidden",
          completed ? "pointer-events-none" : "pointer-events-auto",
        )}
        animate={{ opacity: completed ? 0 : 1, height: completed ? 0 : "auto" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="rounded-md border border-neutral-5 bg-neutral-02 p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-12">Choose payment method</p>

            <label className="flex items-start gap-3 rounded-md border border-neutral-4 bg-white p-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="PAYFAST"
                checked={paymentMethod === "PAYFAST"}
                onChange={() => setPaymentMethod("PAYFAST")}
                className="mt-1"
              />
              <span className="text-sm text-neutral-11">
                <span className="font-medium block">PayFast (Recommended)</span>
                <span className="text-neutral-09">
                  Pay securely using card, JazzCash, EasyPaisa, and supported bank options.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-md border border-neutral-4 bg-white p-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="mt-1"
              />
              <span className="text-sm text-neutral-11">
                <span className="font-medium block">Cash on Delivery</span>
                <span className="text-neutral-09">
                  Place your order now and pay the rider at delivery time.
                </span>
              </span>
            </label>
          </div>

          <p className="text-xs text-neutral-09">Selected: {paymentMethodLabel}</p>
        </div>
        <Button
          onClick={() => onContinue(paymentMethod)}
          variant="dark"
          text="Continue to Review"
          className="mt-6 w-full"
        />
      </motion.div>
    </div>
  );
}
