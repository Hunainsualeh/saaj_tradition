import { AdminHeading } from "@/components/admin";
import { AdminPaymentsPage } from "@/components/admin";
import type { Metadata } from "next";
import { getPaymentSummary, getPaymentRecords } from "@/lib/server/queries";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function Page() {
  const [summaryRes, recordsRes] = await Promise.all([
    getPaymentSummary(),
    getPaymentRecords(),
  ]);

  if (!summaryRes.success) {
    return <div>Error loading payment summary: {summaryRes.error}</div>;
  }
  if (!recordsRes.success) {
    return <div>Error loading payment records: {recordsRes.error}</div>;
  }

  return (
    <div>
      <AdminHeading heading="Payments" />
      <AdminPaymentsPage summary={summaryRes.data} records={recordsRes.data} />
    </div>
  );
}
