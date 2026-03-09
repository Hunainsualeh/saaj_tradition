"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Users,
  ShoppingBag,
  Mail,
  Heart,
  UserX,
  Send,
  Loader2,
} from "lucide-react";
import type { NewsletterSubscriber } from "@prisma/client";
import {
  unsubscribeFromNewsletter,
  sendWelcomeEmailAction,
  sendThankYouEmailAction,
} from "@/lib/server/actions/email-actions";
import type { OrderCustomer } from "@/lib/server/actions/email-actions";

type Props = {
  subscribers: NewsletterSubscriber[];
  orderCustomers: OrderCustomer[];
};

type Tab = "subscribers" | "orders";

export function AdminCustomersView({ subscribers: initialSubs, orderCustomers }: Props) {
  const [tab, setTab] = useState<Tab>("subscribers");
  const [subscribers, setSubscribers] = useState(initialSubs);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const activeSubscribers = subscribers.filter((s) => s.isActive).length;

  const handleUnsubscribe = async (email: string) => {
    if (!confirm(`Unsubscribe ${email}?`)) return;
    const result = await unsubscribeFromNewsletter(email);
    if (result.success) {
      setSubscribers((prev) =>
        prev.map((s) =>
          s.email === email ? { ...s, isActive: false } : s,
        ),
      );
      toast.success("Unsubscribed");
    } else {
      toast.error("Failed to unsubscribe");
    }
  };

  const handleSendWelcome = (email: string, name?: string | null) => {
    setSendingEmail(email);
    startTransition(async () => {
      const result = await sendWelcomeEmailAction(email, name ?? undefined);
      setSendingEmail(null);
      if (result.success) {
        toast.success(`Welcome email sent to ${email}`);
      } else {
        toast.error("Failed to send email");
      }
    });
  };

  const handleSendThankYou = (
    email: string,
    customerName: string,
    orderNumber?: number | string,
  ) => {
    setSendingEmail(email);
    startTransition(async () => {
      const result = await sendThankYouEmailAction(email, customerName, orderNumber);
      setSendingEmail(null);
      if (result.success) {
        toast.success(`Thank-you email sent to ${email}`);
      } else {
        toast.error("Failed to send email");
      }
    });
  };

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      key: "subscribers",
      label: "Newsletter Subscribers",
      count: activeSubscribers,
      icon: <Mail size={14} />,
    },
    {
      key: "orders",
      label: "Order Customers",
      count: orderCustomers.length,
      icon: <ShoppingBag size={14} />,
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      {/* Summary cards */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3 min-w-[160px]">
          <div className="p-2 rounded-lg bg-green-50">
            <Mail className="text-green-600" size={16} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Subscribers</p>
            <p className="text-xl font-bold text-gray-900">
              {activeSubscribers}
              <span className="text-xs font-normal text-gray-400 ml-1">
                / {subscribers.length}
              </span>
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3 min-w-[160px]">
          <div className="p-2 rounded-lg bg-blue-50">
            <ShoppingBag className="text-blue-600" size={16} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Unique Order Customers</p>
            <p className="text-xl font-bold text-gray-900">{orderCustomers.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`cursor-pointer flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "text-gray-900 border-b-2 border-gray-900 -mb-px bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.icon}
              {t.label}
              <span
                className={`ml-1 inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${
                  tab === t.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Subscribers Tab */}
        {tab === "subscribers" && (
          <>
            {subscribers.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-3 text-gray-300" size={36} />
                <p className="text-gray-500 text-sm">No subscribers yet.</p>
                <p className="text-gray-400 text-xs mt-1">
                  Subscribers will appear here once someone signs up from the footer.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Subscribed
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {s.email}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            s.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {s.isActive ? "Active" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(s.subscribedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {s.isActive && (
                            <button
                              onClick={() => handleSendWelcome(s.email, s.name)}
                              disabled={sendingEmail === s.email}
                              title="Send welcome email"
                              className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                            >
                              {sendingEmail === s.email ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Heart size={12} />
                              )}
                              Welcome
                            </button>
                          )}
                          {s.isActive && (
                            <button
                              onClick={() => handleUnsubscribe(s.email)}
                              title="Unsubscribe"
                              className="cursor-pointer p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Order Customers Tab */}
        {tab === "orders" && (
          <>
            {orderCustomers.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag className="mx-auto mb-3 text-gray-300" size={36} />
                <p className="text-gray-500 text-sm">No order customers yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Orders
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Last Order
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderCustomers.map((c) => (
                    <tr key={c.email} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {c.email}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                          {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(c.lastOrderAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            handleSendThankYou(c.email, c.name)
                          }
                          disabled={sendingEmail === c.email}
                          title="Send thank-you email"
                          className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 ml-auto"
                        >
                          {sendingEmail === c.email ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          Thank You
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
