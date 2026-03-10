"use client";

import { useState } from "react";
import { toast } from "sonner";

import { CheckoutStep } from "@/types/client";
import { DeliveryDetailsData } from "./schema";
import { CircleCheckIcon } from "@/components/icons";
import { cn } from "@/lib";
import { DeliveryDetailsStep } from "./DeliveryDetailsStep";
import { OrderSummaryStep } from "./OrderSummaryStep";
import { CheckoutPaymentMethod, PaymentStep } from "./PaymentStep";

type CheckoutFormComponentProps = {
  id: string;
  children: React.ReactNode;
  header: string;
  completed: boolean;
  stepNumber: number;
  isActive: boolean;
};

const STEPS = [
  { id: "1", label: "Delivery" },
  { id: "2", label: "Payment" },
  { id: "3", label: "Review" },
];

function StepperBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, idx) => {
        const num = idx + 1;
        const isCompleted = currentStep > num;
        const isActive = currentStep === num;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                  isCompleted
                    ? "bg-neutral-11 border-neutral-11 text-white"
                    : isActive
                      ? "border-neutral-11 text-neutral-11 bg-white"
                      : "border-neutral-5 text-neutral-7 bg-white",
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8l3.5 3.5L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCompleted || isActive ? "text-neutral-11" : "text-neutral-7",
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                  currentStep > num ? "bg-neutral-11" : "bg-neutral-5",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckoutFormComponent(props: CheckoutFormComponentProps) {
  // === PROPS ===
  const { children, header, completed, id, isActive } = props;

  return (
    <div
      id={id}
      className={cn(
        "flex py-6 flex-col",
        completed && id === "1" && "border-y border-neutral-5",
        completed && id === "2" && "border-b border-neutral-5",
      )}
    >
      <div className={"flex items-center justify-between mb-4"}>
        <h2
          className={cn(
            "text-2xl font-medium",
            isActive ? "text-neutral-12" : "text-neutral-8",
          )}
        >
          {header}
        </h2>
        {completed && <CircleCheckIcon />}
      </div>
      {children}
    </div>
  );
}

type CheckoutFormProps = {
  orderId: string;
  paymentFailed?: boolean;
  prefillDelivery?: DeliveryDetailsData | null;
};

export function CheckoutForm(props: CheckoutFormProps) {
  // === PROPS ===
  const { orderId, paymentFailed, prefillDelivery } = props;

  // === STATE ===
  // When returning from a failed payment with pre-filled delivery, skip to step 2
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    paymentFailed && prefillDelivery ? 2 : 1,
  );

  const [deliveryData, setDeliveryData] = useState<DeliveryDetailsData | null>(
    prefillDelivery ?? null,
  );
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("PAYFAST");

  // Show a one-time banner when landing back from a failed payment
  useState(() => {
    if (paymentFailed) {
      toast.error("Payment failed. Please try again or choose a different method.");
    }
  });

  // === FUNCTIONS ===
  const handleConfirmDelivery = (deliveryData: DeliveryDetailsData) => {
    setDeliveryData(deliveryData);
    setCurrentStep(2);

    // Wait for DOM to update, then scroll
    setTimeout(() => {
      const el = document.getElementById("2");
      if (!el) return;

      window.scrollTo({
        top: el.offsetTop - 500,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleConfirmPayment = (method: CheckoutPaymentMethod) => {
    setPaymentMethod(method);
    setCurrentStep(3);

    // Wait for DOM to update, then scroll
    setTimeout(() => {
      const el = document.getElementById("3");
      if (!el) return;

      window.scrollTo({
        top: el.offsetTop - 500,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleEditDelivery = () => {
    setCurrentStep(1);
  };

  return (
    <div>
      {/* Step progress indicator */}
      <StepperBar currentStep={currentStep} />

      {/* Delivery Details Step */}
      <CheckoutFormComponent
        id="1"
        header="Delivery Details"
        completed={currentStep !== 1}
        stepNumber={1}
        isActive={currentStep === 1}
      >
        <DeliveryDetailsStep
          completed={currentStep !== 1}
          onEditDelivery={handleEditDelivery}
          onContinueToPayment={handleConfirmDelivery}
        />
      </CheckoutFormComponent>

      {/* Payment Step */}
      <CheckoutFormComponent
        id="2"
        header="Payment"
        completed={currentStep > 2}
        stepNumber={2}
        isActive={currentStep === 2}
      >
        <div className={currentStep > 1 ? "block" : "hidden"}>
          <PaymentStep
            completed={currentStep > 2}
            onContinue={handleConfirmPayment}
            onEditPaymentRequest={() => setCurrentStep(2)}
            selectedMethod={paymentMethod}
          />
        </div>
      </CheckoutFormComponent>

      {/* Order Summary Step */}
      <CheckoutFormComponent
        id="3"
        header="Review & Place Order"
        completed={currentStep > 3}
        stepNumber={3}
        isActive={currentStep === 3}
      >
        <div className={currentStep === 3 ? "block" : "hidden"}>
          <OrderSummaryStep
            deliveryData={deliveryData}
            orderId={orderId}
            paymentMethod={paymentMethod}
          />
        </div>
      </CheckoutFormComponent>
    </div>
  );
}
