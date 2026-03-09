import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { CheckoutSuccess } from "@/components/common/CheckoutSuccess/CheckoutSuccess";
import { getOrderForSuccessPage } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutSuccessPage(
  props: CheckoutSuccessPageProps,
) {
  // === PROPS ===
  const searchParams = await props.searchParams;
  const { orderId } = searchParams;

  // === FETCH DATA & REDIRECT ===
  if (!orderId) {
    redirect("/");
  }

  const order = await getOrderForSuccessPage(orderId);

  if (!order || !order.success || !order.data) {
    redirect("/");
  }

  return (
    <CheckoutSuccess order={order.data} />
  );
}
