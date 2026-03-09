import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui";

type OrderSummaryStepUIProps = {
  isSubmitting: boolean;
  onConfirmPayment: () => void;
  buttonText?: string;
};

export function OrderSummaryStepUI(props: OrderSummaryStepUIProps) {
  // === PROPS ===
  const { isSubmitting, onConfirmPayment, buttonText = "Submit payment" } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-2 flex flex-col"
    >
      <span className="text-neutral-10 text-sm">
        By clicking the &quot;Submit payment&quot; button, you confirm that you
        have read, understand and accept our{" "}
        <Link href="#" className="font-bold underline">
          Terms of Use
        </Link>
        ,{" "}
        <Link href="#" className="font-bold underline">
          Terms of Sale
        </Link>
        ,{" "}
        <Link href="#" className="font-bold underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="#" className="font-bold underline">
          Returns Policy
        </Link>
        .
      </span>

      <Button
        onClick={onConfirmPayment}
        variant="dark"
        text={buttonText}
        className="mt-8 w-full"
        isLoading={isSubmitting}
      />
    </motion.div>
  );
}
