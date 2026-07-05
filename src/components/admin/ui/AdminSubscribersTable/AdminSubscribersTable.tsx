"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users, UserX } from "lucide-react";
import type { NewsletterSubscriber } from "@prisma/client";
import { unsubscribeFromNewsletter } from "@/lib/server/actions/email-actions";
import { formatAdminDate } from "@/lib/utils";

type Props = {
  subscribers: NewsletterSubscriber[];
};

export function AdminSubscribersTable({ subscribers }: Props) {
  const [items, setItems] = useState(subscribers);

  const handleUnsubscribe = async (email: string) => {
    if (!confirm(`Unsubscribe ${email}?`)) return;
    const result = await unsubscribeFromNewsletter(email);
    if (result.success) {
      setItems((prev) => prev.map((s) => s.email === email ? { ...s, isActive: false } : s));
      toast.success("Unsubscribed");
    } else {
      toast.error("Failed");
    }
  };

  const active = items.filter((s) => s.isActive).length;

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 w-fit">
        <div className="p-2.5 rounded-lg bg-green-50">
          <Users className="text-green-600" size={18} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Active Subscribers</p>
          <p className="text-xl font-bold text-gray-900">{active} / {items.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-3 text-gray-300" size={36} />
            <p className="text-gray-500 text-sm">No subscribers yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscribed</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-gray-900">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500">{s.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "Active" : "Unsubscribed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatAdminDate(s.subscribedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.isActive && (
                      <button
                        onClick={() => handleUnsubscribe(s.email)}
                        className="cursor-pointer p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Unsubscribe"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
