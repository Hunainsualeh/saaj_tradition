"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  CreditCard,
  Banknote,
  FileSpreadsheet,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { PaymentRecord, PaymentSummary } from "@/types/client";
import { adminRoutes } from "@/lib";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  summary: PaymentSummary;
  records: PaymentRecord[];
};

type SortField =
  | "orderNumber"
  | "createdAt"
  | "totalPrice"
  | "delieveryName"
  | "paymentStatus"
  | "status";
type SortDir = "asc" | "desc";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-600/20",
  },
  PAID: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
  },
  FAILED: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-600/20",
  },
  REFUNDED: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    ring: "ring-gray-500/20",
  },
};

const ORDER_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-600/20",
  },
  PAID: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-600/20",
  },
  PROCESSING: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-600/20",
  },
  SHIPPED: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    ring: "ring-cyan-600/20",
  },
  DELIVERED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
  },
  CANCELLED: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-600/20",
  },
  REFUNDED: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    ring: "ring-gray-500/20",
  },
};

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  return `Rs. ${n.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({
  value,
  styles,
}: {
  value: string;
  styles: Record<string, { bg: string; text: string; ring: string }>;
}) {
  const s = styles[value] ?? {
    bg: "bg-neutral-50",
    text: "text-neutral-600",
    ring: "ring-neutral-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}
    >
      {value}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AdminPaymentsPage({ summary, records }: Props) {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sort
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(0);

  // ── Filter + search + sort ──
  const filtered = useMemo(() => {
    let data = [...records];

    // Status filter
    if (statusFilter !== "ALL") {
      data = data.filter((r) => r.paymentStatus === statusFilter);
    }
    // Method filter
    if (methodFilter !== "ALL") {
      data = data.filter((r) => r.paymentMethod === methodFilter);
    }
    // Date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      data = data.filter((r) => new Date(r.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => new Date(r.createdAt) <= to);
    }
    // Search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.orderNumber.toString().includes(q) ||
          r.delieveryName?.toLowerCase().includes(q) ||
          r.deliveryEmail?.toLowerCase().includes(q) ||
          r.deliveryPhone?.toLowerCase().includes(q) ||
          r.deliveryCity?.toLowerCase().includes(q) ||
          r.paymentStatus.toLowerCase().includes(q) ||
          r.paymentMethod.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }

    // Sort
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "orderNumber":
          cmp = a.orderNumber - b.orderNumber;
          break;
        case "createdAt":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "totalPrice":
          cmp = a.totalPrice - b.totalPrice;
          break;
        case "delieveryName":
          cmp = (a.delieveryName ?? "").localeCompare(b.delieveryName ?? "");
          break;
        case "paymentStatus":
          cmp = a.paymentStatus.localeCompare(b.paymentStatus);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [
    records,
    search,
    statusFilter,
    methodFilter,
    dateFrom,
    dateTo,
    sortField,
    sortDir,
  ]);

  // Pagination computed
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  const updateFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  // ── Filtered summary (recompute based on what's visible) ──
  const filteredSummary = useMemo(() => {
    const REVENUE_STATUSES = [
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ];
    const revOrders = filtered.filter((r) =>
      REVENUE_STATUSES.includes(r.status),
    );
    return {
      filteredRevenue: revOrders.reduce((s, r) => s + r.totalPrice, 0),
      filteredCount: filtered.length,
    };
  }, [filtered]);

  // ── Export handlers ──
  const handleExcelExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("paymentStatus", statusFilter);
      if (methodFilter !== "ALL") params.set("paymentMethod", methodFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (search) params.set("search", search);

      const res = await fetch(
        `/api/admin/payments/export-excel?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel exported successfully");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handlePdfExport = async () => {
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const el = document.getElementById("payments-table-export");
      if (!el) return;

      // Build a clean printable container
      const clone = el.cloneNode(true) as HTMLElement;
      const wrapper = document.createElement("div");
      wrapper.style.padding = "20px";
      wrapper.style.fontFamily = "system-ui, sans-serif";

      const title = document.createElement("h2");
      title.textContent = `Payment Records — ${new Date().toLocaleDateString()}`;
      title.style.marginBottom = "12px";
      wrapper.appendChild(title);

      const info = document.createElement("p");
      info.style.fontSize = "12px";
      info.style.color = "#666";
      info.style.marginBottom = "16px";
      info.textContent = `Total: ${filtered.length} records | Revenue: ${fmtCurrency(filteredSummary.filteredRevenue)}`;
      wrapper.appendChild(info);
      wrapper.appendChild(clone);

      await html2pdf()
        .set({
          margin: [10, 8],
          filename: `payments-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(wrapper)
        .save();

      toast.success("PDF exported successfully");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  // ── Summary cards ──
  const summaryCards = [
    {
      label: "Total Revenue",
      value: fmtCurrency(summary.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Monthly Revenue",
      value: fmtCurrency(summary.monthlyRevenue),
      sub: `${summary.monthlyOrders} orders`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Successful",
      value: summary.successfulPayments.toLocaleString(),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Failed",
      value: summary.failedPayments.toLocaleString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Pending",
      value: summary.pendingPayments.toLocaleString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Refunded",
      value: summary.refundedPayments.toLocaleString(),
      icon: RotateCcw,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      label: "Online (PayFast)",
      value: fmtCurrency(summary.onlineRevenue),
      sub: `${summary.onlineOrders} orders`,
      icon: CreditCard,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      label: "COD Revenue",
      value: fmtCurrency(summary.codRevenue),
      sub: `${summary.codOrders} orders`,
      icon: Banknote,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  // ── Sort header helper ──
  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors"
    >
      {children}
      <ArrowUpDown
        className={`w-3 h-3 ${sortField === field ? "text-gray-900" : "text-gray-300"}`}
      />
    </button>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`${card.bgColor} rounded-lg p-1.5`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            {card.sub && (
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Avg Order Value ribbon ── */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl border border-gray-100 px-5 py-3">
        <div className="text-sm text-gray-500">
          Avg. Order Value:{" "}
          <span className="font-semibold text-gray-900">
            {fmtCurrency(Math.round(summary.avgOrderValue))}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="text-sm text-gray-500">
          Total Transactions:{" "}
          <span className="font-semibold text-gray-900">
            {summary.totalTransactions.toLocaleString()}
          </span>
        </div>
        {filtered.length !== records.length && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <div className="text-sm text-gray-500">
              Filtered:{" "}
              <span className="font-semibold text-gray-900">
                {filteredSummary.filteredCount} records
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-gray-900">
                {fmtCurrency(filteredSummary.filteredRevenue)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Filters + Export ── */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Order #, name, email, phone, city..."
              value={search}
              onChange={(e) => updateFilter(setSearch)(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition"
            />
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Payment Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              updateFilter(setStatusFilter)(e.target.value)
            }
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Method
          </label>
          <select
            value={methodFilter}
            onChange={(e) =>
              updateFilter(setMethodFilter)(e.target.value)
            }
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition"
          >
            <option value="ALL">All Methods</option>
            <option value="PAYFAST">PayFast</option>
            <option value="COD">COD</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateFilter(setDateFrom)(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateFilter(setDateTo)(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition"
          />
        </div>

        {/* Export buttons */}
        <div className="flex items-end gap-2">
          <button
            onClick={handleExcelExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handlePdfExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto" id="payments-table-export">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-4 py-3 text-left">
                  <SortHeader field="orderNumber">Order #</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="delieveryName">Customer</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="createdAt">Date</SortHeader>
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader field="totalPrice">Amount</SortHeader>
                </th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-center">Method</th>
                <th className="px-4 py-3 text-center">
                  <SortHeader field="paymentStatus">Payment</SortHeader>
                </th>
                <th className="px-4 py-3 text-center">
                  <SortHeader field="status">Order Status</SortHeader>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No payment records found.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() =>
                      router.push(`${adminRoutes.orders}/${r.id}`)
                    }
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      #{r.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-[160px]">
                        {r.delieveryName ?? "—"}
                      </div>
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">
                        {r.deliveryEmail ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {fmtCurrency(r.totalPrice)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {r.itemsCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          r.paymentMethod === "COD"
                            ? "bg-teal-50 text-teal-700 ring-teal-600/20"
                            : "bg-violet-50 text-violet-700 ring-violet-600/20"
                        }`}
                      >
                        {r.paymentMethod === "COD" ? "COD" : "PayFast"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        value={r.paymentStatus}
                        styles={PAYMENT_STATUS_STYLES}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        value={r.status}
                        styles={ORDER_STATUS_STYLES}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page > totalPages - 4) {
                  pageNum = totalPages - 7 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[32px] h-8 rounded-md text-xs font-medium transition ${
                      page === pageNum
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page === totalPages - 1}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
