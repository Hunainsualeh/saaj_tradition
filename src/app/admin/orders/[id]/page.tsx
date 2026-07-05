import { AdminHeading, AdminOrderView } from "@/components/admin";
import type { Metadata } from "next";
import { getAdminOrderById } from "@/lib/server/queries";
import { cache } from "react";

type AdminOrderPageProps = { params: { id: string } };

// Deduplicate the DB query across generateMetadata + page render in the same request
const getOrder = cache(async (id: string) => getAdminOrderById(id));

export async function generateMetadata(
  props: AdminOrderPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const order = await getOrder(id);
  if (!order.success || !order.data) return { title: "Order" };
  return { title: `Order #${order.data.orderNumber}` };
}

export default async function Page({ params }: AdminOrderPageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order.success || !order.data) {
    return <p>Order not found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminHeading heading="View Order" />
      <AdminOrderView order={order.data} />
    </div>
  );
}
