import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui";
import { DeliveryDetailsData } from "./schema";

type OrderSummaryStepUIProps = {
  isSubmitting: boolean;
  onSubmit: () => void;
  orderId: string;
  paymentMethod: string;
  delivery: DeliveryDetailsData | null;
  buttonText?: string;
};

export function OrderSummaryStepUI(props: OrderSummaryStepUIProps) {
  // === PROPS ===
  const {
    isSubmitting,
    onSubmit,
    orderId,
    paymentMethod,
    delivery,
    buttonText = "Place Order",
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-2 flex flex-col"
    >
      {/*
        Native form POST → /api/checkout/place-order, which does the work and
        replies with a 303 redirect the browser follows natively. This is the
        only reliable way to leave the page on iOS Safari: a scripted
        window.location after an awaited server call is dropped once the tap's
        transient activation expires, which is why COD/PayFast previously
        "placed the order but never reached the success page" on iPhone.
      */}
      <form
        method="POST"
        action="/api/checkout/place-order"
        onSubmit={onSubmit}
        className="flex flex-col"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
        <input
          type="hidden"
          name="delivery"
          value={delivery ? JSON.stringify(delivery) : ""}
        />

        <span className="text-neutral-10 text-sm">
          By clicking the &quot;{buttonText}&quot; button, you confirm that you
          have read, understand and accept our{" "}
          <Link href="/terms-of-use" className="font-bold underline">
            Terms of Use
          </Link>
          ,{" "}
          <Link href="/terms-of-sale" className="font-bold underline">
            Terms of Sale
          </Link>
          ,{" "}
          <Link href="/privacy-policy" className="font-bold underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/return-policy" className="font-bold underline">
            Returns Policy
          </Link>
          .
        </span>

        <Button
          type="submit"
          variant="dark"
          text={buttonText}
          className="mt-8 w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting || !delivery}
        />
      </form>
    </motion.div>
  );
}
