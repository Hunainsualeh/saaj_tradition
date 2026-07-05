import { AdminHeading, AdminDashboardStats } from "@/components/admin";
import type { Metadata } from "next";
import {
  getDashboardStats,
  getDashboardProductStats,
} from "@/lib/server/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Page() {
  // === QUERIES ===
  const [orderStats, productStats] = await Promise.all([
    getDashboardStats(),
    getDashboardProductStats(),
  ]);

  if (!orderStats.success || !productStats.success) {
    const errorMessage = !orderStats.success
      ? orderStats.error
      : !productStats.success
        ? productStats.error
        : "Unknown error";

    return (
      <div>
        <AdminHeading heading="Admin Dashboard" />
        <div className="mt-6 text-red-600">
          Error loading dashboard stats: {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeading heading="Admin Dashboard" />
      <div className="mt-4">
        <AdminDashboardStats
          orderStats={orderStats.data}
          productStats={productStats.data}
        />
      </div>
    </div>
  );
}
