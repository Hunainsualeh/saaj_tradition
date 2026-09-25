import { Suspense } from "react";
import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";
import { TrackOrderForm } from "@/components/common/TrackOrderForm/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Enter your Saaj Tradition tracking ID to check the delivery status of your order.",
  alternates: { canonical: "/track" },
  ...NOINDEX_METADATA,
};

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<main className="min-h-[60vh]" aria-busy="true" />}>
      <TrackOrderForm />
    </Suspense>
  );
}
