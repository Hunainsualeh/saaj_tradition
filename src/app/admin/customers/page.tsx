import type { Metadata } from "next";
import { AdminHeading } from "@/components/admin";
import { AdminCustomersView } from "@/components/admin/ui/AdminCustomersView/AdminCustomersView";
import {
  getNewsletterSubscribers,
  getOrderCustomers,
} from "@/lib/server/actions/email-actions";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage() {
  const [subscribersResult, orderCustomersResult] = await Promise.all([
    getNewsletterSubscribers(),
    getOrderCustomers(),
  ]);

  const subscribers = subscribersResult.success ? subscribersResult.data : [];
  const orderCustomers = orderCustomersResult.success
    ? orderCustomersResult.data
    : [];

  return (
    <div>
      <AdminHeading heading="Customers" />
      <AdminCustomersView
        subscribers={subscribers}
        orderCustomers={orderCustomers}
      />
    </div>
  );
}
