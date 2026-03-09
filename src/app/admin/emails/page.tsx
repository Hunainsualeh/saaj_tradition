import Link from "next/link";
import type { Metadata } from "next";

import { AdminHeading } from "@/components/admin";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminEmailDashboard } from "@/components/admin/ui/AdminEmailDashboard";
import { getEmailTemplates, getNewsletterSubscribers } from "@/lib/server/actions/email-actions";
import { adminRoutes } from "@/lib";

export const metadata: Metadata = {
  title: "Email Management",
};

export default async function AdminEmailsPage() {
  const [templatesResult, subscribersResult] = await Promise.all([
    getEmailTemplates(),
    getNewsletterSubscribers(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminHeading heading="Email Management" />
        <div className="flex gap-2">
          <Link href={adminRoutes.emailSubscribers}>
            <AdminButton variant="outline">View Subscribers</AdminButton>
          </Link>
          <Link href={adminRoutes.emailBroadcast}>
            <AdminButton variant="outline">Send Newsletter</AdminButton>
          </Link>
          <Link href={adminRoutes.emailsCreate}>
            <AdminButton>New Template</AdminButton>
          </Link>
        </div>
      </div>

      <AdminEmailDashboard
        templates={templatesResult.success ? templatesResult.data : []}
        subscriberCount={subscribersResult.success ? subscribersResult.data.length : 0}
      />
    </div>
  );
}
