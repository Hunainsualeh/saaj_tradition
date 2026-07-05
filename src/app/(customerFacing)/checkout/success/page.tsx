import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { CheckoutSuccess } from "@/components/common/CheckoutSuccess/CheckoutSuccess";
import { getOrderForSuccessPage } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ orderId?: string; token?: string }>;
};

export default async function CheckoutSuccessPage(
  props: CheckoutSuccessPageProps,
) {
  // === PROPS ===
  const searchParams = await props.searchParams;
  const { orderId, token } = searchParams;

  // Prefer the unguessable tracking token; fall back to raw orderId for any
  // legacy links still in flight.
  const identifier = token ?? orderId;

  // === FETCH DATA & REDIRECT ===
  if (!identifier) {
    redirect("/");
  }

  const order = await getOrderForSuccessPage(identifier);

  if (!order || !order.success || !order.data) {
    redirect("/");
  }

  return (
    <CheckoutSuccess order={order.data} />
  );
}
