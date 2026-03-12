"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  BarChart3,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Tag,
  Mail,
  Settings,
  Layers,
  FileText,
  Users,
  ArrowRight,
  CreditCard,
  AlertOctagon,
} from "lucide-react";
import { OrderDashboardStats, ProductDashboardStats } from "@/types/client";
import { adminRoutes } from "@/lib";

// ─── Types ───────────────────────────────────────────────────────────────────
type Props = {
  orderStats: OrderDashboardStats;
  productStats: ProductDashboardStats;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:    { bg: "bg-amber-100",   text: "text-amber-700",  dot: "#f59e0b" },
  PAID:       { bg: "bg-blue-100",    text: "text-blue-700",   dot: "#3b82f6" },
  PROCESSING: { bg: "bg-violet-100",  text: "text-violet-700", dot: "#8b5cf6" },
  SHIPPED:    { bg: "bg-cyan-100",    text: "text-cyan-700",   dot: "#06b6d4" },
  DELIVERED:  { bg: "bg-emerald-100", text: "text-emerald-700",dot: "#10b981" },
  CANCELLED:  { bg: "bg-red-100",     text: "text-red-700",    dot: "#ef4444" },
  REFUNDED:   { bg: "bg-gray-100",    text: "text-gray-600",   dot: "#9ca3af" },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: "bg-amber-100",   text: "text-amber-700",  dot: "#f59e0b" },
  PAID:     { bg: "bg-emerald-100", text: "text-emerald-700", dot: "#10b981" },
  FAILED:   { bg: "bg-red-100",     text: "text-red-700",    dot: "#ef4444" },
  REFUNDED: { bg: "bg-gray-100",    text: "text-gray-600",   dot: "#9ca3af" },
};

// ─── Donut chart helper ────────────────────────────────────────────────────
// Circle r=15.91 → circumference ≈ 100, so strokeDasharray values == percentages
function DonutChart({
  segments,
  sublabel,
}: {
  segments: { value: number; color: string; name: string }[];
  label: string;
  sublabel: string;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const [hovered, setHovered] = useState<string | null>(null);

  const computed = useMemo(() => {
    if (total === 0) return [];
    let cumulative = 0;
    return segments
      .filter((s) => s.value > 0)
      .map((s) => {
        const pct = (s.value / total) * 100;
        const offset = 25 - cumulative;
        cumulative += pct;
        return { ...s, pct, offset };
      });
  }, [segments, total]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* SVG donut */}
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          {total === 0 ? (
            <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#e5e7eb" strokeWidth="4" />
          ) : (
            computed.map((seg, i) => (
              <circle
                key={i}
                cx="18" cy="18" r="15.91"
                fill="transparent"
                stroke={seg.color}
                strokeWidth={hovered === seg.name ? 5 : 4}
                strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                strokeDashoffset={seg.offset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHovered(seg.name)}
                onMouseLeave={() => setHovered(null)}
                style={{ transformOrigin: "50% 50%", transform: "rotate(-90deg)" }}
              />
            ))
          )}
        </svg>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-neutral-11 leading-none">{total}</span>
          <span className="text-[10px] text-neutral-08 mt-0.5">{sublabel}</span>
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-col gap-1.5 w-full">
        {segments.filter((s) => s.value > 0).map((seg) => (
          <li
            key={seg.name}
            className={`flex items-center justify-between gap-2 rounded px-2 py-1 transition-colors cursor-default ${hovered === seg.name ? "bg-neutral-02" : ""}`}
            onMouseEnter={() => setHovered(seg.name)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-xs text-neutral-09 truncate">{seg.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-neutral-11">{seg.value}</span>
              <span className="text-[10px] text-neutral-07">
                ({total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </li>
        ))}
        {total === 0 && (
          <li className="text-xs text-neutral-08 px-2">No data yet</li>
        )}
      </ul>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  alert,
  alertText,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
  alert?: boolean;
  alertText?: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-neutral-03 p-5 hover:border-neutral-05 hover:shadow-md transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-06 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
      </div>
      <div>
        <p className="text-sm text-neutral-08 font-medium">{label}</p>
        <p className="text-2xl font-bold text-neutral-11 mt-0.5 leading-none">{value}</p>
        {alert && alertText && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {alertText}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────────────
function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-03 bg-white hover:shadow-md hover:border-neutral-05 transition-all group`}
    >
      <div className={`p-2.5 rounded-lg ${color} transition-transform group-hover:scale-110`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-medium text-neutral-09 text-center leading-tight">{label}</span>
    </Link>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "#9ca3af" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const cfg = PAYMENT_STATUS_COLORS[status] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "#9ca3af" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminDashboardStats({ orderStats, productStats }: Props) {
  const [search, setSearch] = useState("");

  const inactiveProducts = productStats.totalProducts - productStats.activeProducts;

  // Filter recent orders by search
  const filteredRecent = useMemo(() => {
    if (!search.trim()) return orderStats.recentOrders;
    const q = search.toLowerCase();
    return orderStats.recentOrders.filter(
      (o) =>
        o.orderNumber.toString().includes(q) ||
        o.delieveryName?.toLowerCase().includes(q) ||
        o.deliveryEmail?.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q),
    );
  }, [search, orderStats.recentOrders]);

  // Order status donut data
  const orderDonutSegments = [
    { name: "Pending",    value: orderStats.statusBreakdown["PENDING"]    ?? 0, color: "#f59e0b" },
    { name: "Paid",       value: orderStats.statusBreakdown["PAID"]       ?? 0, color: "#3b82f6" },
    { name: "Processing", value: orderStats.statusBreakdown["PROCESSING"] ?? 0, color: "#8b5cf6" },
    { name: "Shipped",    value: orderStats.statusBreakdown["SHIPPED"]    ?? 0, color: "#06b6d4" },
    { name: "Delivered",  value: orderStats.statusBreakdown["DELIVERED"]  ?? 0, color: "#10b981" },
    { name: "Cancelled",  value: orderStats.statusBreakdown["CANCELLED"]  ?? 0, color: "#ef4444" },
    { name: "Refunded",   value: orderStats.statusBreakdown["REFUNDED"]   ?? 0, color: "#9ca3af" },
  ];

  // Product status donut data
  const productDonutSegments = [
    { name: "Active",    value: productStats.activeProducts,  color: "#10b981" },
    { name: "Inactive",  value: inactiveProducts,             color: "#9ca3af" },
    { name: "Low Stock", value: productStats.lowStockProducts, color: "#f97316" },
  ];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">

      {/* ── Header + Search ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-08">{greeting} 👋 Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-07 pointer-events-none" />
          <input
            type="text"
            placeholder="Search recent orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-03 rounded-lg bg-white text-neutral-11 placeholder:text-neutral-07 focus:outline-none focus:ring-2 focus:ring-neutral-05 transition"
          />
        </div>
      </div>

      {/* ── Order KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Revenue"
          value={`Rs.${orderStats.totalRevenue.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="Total Orders"
          value={orderStats.totalOrders}
          icon={ShoppingBag}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="Pending Orders"
          value={orderStats.pendingOrders}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          href={adminRoutes.orders}
          alert={orderStats.pendingOrders > 0}
          alertText={`${orderStats.pendingOrders} awaiting action`}
        />
        <KpiCard
          label="Avg. Order Value"
          value={`Rs.${orderStats.averageOrderValue.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={BarChart3}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          href={adminRoutes.orders}
        />
      </div>

      {/* ── Payment KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Pending Payments"
          value={orderStats.pendingPayments}
          icon={CreditCard}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          href={adminRoutes.orders}
          alert={orderStats.pendingPayments > 0}
          alertText={`${orderStats.pendingPayments} awaiting payment confirmation`}
        />
        <KpiCard
          label="Failed Payments"
          value={orderStats.failedPayments}
          icon={AlertOctagon}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          href={adminRoutes.orders}
          alert={orderStats.failedPayments > 0}
          alertText={`${orderStats.failedPayments} payments failed`}
        />
        <KpiCard
          label="PayFast Orders"
          value={orderStats.paymentMethodBreakdown["PAYFAST"] ?? 0}
          icon={CreditCard}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="COD Orders"
          value={orderStats.paymentMethodBreakdown["COD"] ?? 0}
          icon={ShoppingBag}
          iconBg="bg-gray-50"
          iconColor="text-gray-600"
          href={adminRoutes.orders}
        />
      </div>

      {/* ── Product KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Products"
          value={productStats.totalProducts}
          icon={Package}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          href={adminRoutes.products}
        />
        <KpiCard
          label="Active Products"
          value={productStats.activeProducts}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          href={adminRoutes.products}
        />
        <KpiCard
          label="Low Stock"
          value={productStats.lowStockProducts}
          icon={AlertTriangle}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          href={adminRoutes.products}
          alert={productStats.lowStockProducts > 0}
          alertText={`${productStats.lowStockProducts} items below 5 units`}
        />
        <KpiCard
          label="Inactive Products"
          value={inactiveProducts}
          icon={XCircle}
          iconBg="bg-gray-50"
          iconColor="text-gray-500"
          href={adminRoutes.products}
        />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order status chart */}
        <div className="bg-white rounded-xl border border-neutral-03 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-11">Order Status Breakdown</h3>
            <Link href={adminRoutes.orders} className="text-xs text-neutral-08 hover:text-neutral-11 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <DonutChart segments={orderDonutSegments} label="Orders" sublabel="total" />
        </div>

        {/* Product status chart */}
        <div className="bg-white rounded-xl border border-neutral-03 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-11">Product Status Overview</h3>
            <Link href={adminRoutes.products} className="text-xs text-neutral-08 hover:text-neutral-11 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <DonutChart segments={productDonutSegments} label="Products" sublabel="total" />
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-03 p-5">
        <h3 className="text-sm font-semibold text-neutral-11 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          <QuickAction href={adminRoutes.productsCreate} icon={Plus}      label="New Product"    color="bg-emerald-500" />
          <QuickAction href={adminRoutes.orders}         icon={ShoppingBag} label="View Orders"  color="bg-blue-500"   />
          <QuickAction href={adminRoutes.couponsCreate}  icon={Tag}        label="New Coupon"     color="bg-orange-500" />
          <QuickAction href={adminRoutes.blogsCreate}    icon={FileText}   label="New Blog"       color="bg-violet-500" />
          <QuickAction href={adminRoutes.emailBroadcast} icon={Mail}       label="Broadcast"      color="bg-cyan-500"   />
          <QuickAction href={adminRoutes.collections}    icon={Layers}     label="Collections"    color="bg-indigo-500" />
          <QuickAction href={adminRoutes.admins}         icon={Users}      label="Admins"         color="bg-pink-500"   />
          <QuickAction href={adminRoutes.settings}       icon={Settings}   label="Settings"       color="bg-gray-500"   />
        </div>
      </div>

      {/* ── Recent Orders ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-03 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-11">Recent Orders</h3>
          <Link href={adminRoutes.orders} className="text-xs text-neutral-08 hover:text-neutral-11 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {filteredRecent.length === 0 ? (
          <p className="text-sm text-neutral-08 py-4 text-center">
            {search ? "No orders match your search." : "No orders yet."}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-03">
                  <th className="text-left text-xs font-semibold text-neutral-08 pb-2 px-1">Order #</th>
                  <th className="text-left text-xs font-semibold text-neutral-08 pb-2 px-1">Customer</th>
                  <th className="text-left text-xs font-semibold text-neutral-08 pb-2 px-1 hidden sm:table-cell">Date</th>
                  <th className="text-right text-xs font-semibold text-neutral-08 pb-2 px-1">Total</th>
                  <th className="text-right text-xs font-semibold text-neutral-08 pb-2 px-1 hidden md:table-cell">Payment</th>
                  <th className="text-right text-xs font-semibold text-neutral-08 pb-2 px-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecent.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-neutral-02 last:border-none hover:bg-neutral-01 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `${adminRoutes.orders}/${order.id}`}
                  >
                    <td className="py-2.5 px-1 font-semibold text-neutral-11">#{order.orderNumber}</td>
                    <td className="py-2.5 px-1">
                      <div className="font-medium text-neutral-11 truncate max-w-[120px]">
                        {order.delieveryName ?? "—"}
                      </div>
                      <div className="text-xs text-neutral-07 truncate max-w-[120px]">
                        {order.deliveryEmail ?? ""}
                      </div>
                    </td>
                    <td className="py-2.5 px-1 text-neutral-08 hidden sm:table-cell whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-1 text-right font-semibold text-neutral-11 whitespace-nowrap">
                      Rs.{order.totalPrice.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-1 text-right hidden md:table-cell">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="py-2.5 px-1 text-right">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
