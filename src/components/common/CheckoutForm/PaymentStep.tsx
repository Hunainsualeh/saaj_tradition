"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Truck, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib";

export type CheckoutPaymentMethod = "PAYFAST" | "COD";

type PaymentStepProps = {
  onContinue: (paymentMethod: CheckoutPaymentMethod) => void;
  onEditPaymentRequest: () => void;
  completed: boolean;
  selectedMethod: CheckoutPaymentMethod;
};

const METHODS = [
  {
    id: "PAYFAST" as CheckoutPaymentMethod,
    label: "PayFast",
    badge: "Recommended",
    description: "Card, JazzCash, EasyPaisa, and bank transfer.",
    Icon: CreditCard,
  },
  {
    id: "COD" as CheckoutPaymentMethod,
    label: "Cash on Delivery",
    description: "Pay the rider when your order arrives.",
    Icon: Truck,
  },
];

export function PaymentStep(props: PaymentStepProps) {
  const { onContinue, onEditPaymentRequest, completed, selectedMethod } = props;
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>(selectedMethod);

  const selectedLabel = paymentMethod === "PAYFAST" ? "PayFast" : "Cash on Delivery";

  return (
    <div className="space-y-4">
      {/* Completed summary */}
      <motion.div
        animate={{ opacity: completed ? 1 : 0, height: completed ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="overflow-hidden flex border border-neutral-4 rounded-xl bg-white justify-between items-center"
      >
        <div className="flex items-center gap-3 p-4">
          <CheckCircle2 size={16} className="text-neutral-09 shrink-0" />
          <p className="text-sm text-neutral-11">
            <span className="text-neutral-09">Payment: </span>
            <span className="font-medium">{selectedLabel}</span>
          </p>
        </div>
        <button
          onClick={onEditPaymentRequest}
          className="text-xs px-4 py-4 text-neutral-09 hover:text-neutral-12 cursor-pointer font-medium transition-colors"
        >
          Edit
        </button>
      </motion.div>

      {/* Payment selector */}
      <motion.div
        className={cn(
          "overflow-hidden",
          completed ? "pointer-events-none" : "pointer-events-auto",
        )}
        animate={{ opacity: completed ? 0 : 1, height: completed ? 0 : "auto" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-09">
            Payment method
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {METHODS.map(({ id, label, badge, description, Icon }) => {
              const selected = paymentMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={cn(
                    "relative text-left rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer group",
                    selected
                      ? "border-neutral-12 bg-white shadow-sm"
                      : "border-neutral-4 bg-white hover:border-neutral-8 hover:shadow-sm",
                  )}
                >
                  {/* Selected indicator */}
                  {selected && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-neutral-12 flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}

                  {/* Icon */}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 transition-colors",
                      selected ? "bg-neutral-12 text-white" : "bg-neutral-3 text-neutral-10 group-hover:bg-neutral-4",
                    )}
                  >
                    <Icon size={18} />
                  </span>

                  {/* Label + badge */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-neutral-12">{label}</span>
                    {badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {badge}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-09 leading-relaxed">{description}</p>
                </button>
              );
            })}
          </div>
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
