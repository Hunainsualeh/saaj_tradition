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

// ─── Greeting helper ─────────────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

// ─── Breakdown chart (horizontal bars — replaces the old donut) ──────────────
function BreakdownChart({
  segments,
  sublabel,
}: {
  segments: { value: number; color: string; name: string }[];
  sublabel: string;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const active = segments.filter((s) => s.value > 0);

  if (total === 0) {
    return <p className="text-sm text-neutral-08 py-6 text-center">No data yet</p>;
  }

  return (
    <div className="space-y-4">
      {/* total */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-neutral-11 leading-none">{total}</span>
        <span className="text-xs text-neutral-07 uppercase tracking-wide">{sublabel}</span>
      </div>

      {/* stacked proportion bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-02">
        {active.map((s) => (
          <div
            key={s.name}
            title={`${s.name}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            className="h-full transition-all"
          />
        ))}
      </div>

      {/* per-segment rows */}
      <ul className="space-y-2.5">
        {active.map((s) => {
          const pct = (s.value / total) * 100;
          return (
            <li key={s.name} className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-neutral-09 w-24 shrink-0 truncate">{s.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-neutral-02 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
              </div>
              <span className="text-xs font-semibold text-neutral-11 w-7 text-right tabular-nums">{s.value}</span>
              <span className="text-[10px] text-neutral-07 w-9 text-right tabular-nums">{pct.toFixed(0)}%</span>
            </li>
          );
        })}
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
  dotColor,
  wide,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
  alert?: boolean;
  alertText?: string;
  dotColor: string;
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      title={alert && alertText ? alertText : undefined}
      className={`group relative bg-white rounded-xl border border-neutral-03 px-3.5 py-3 hover:border-neutral-05 hover:shadow-sm transition-all flex flex-col gap-2.5 ${wide ? "col-span-2" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span
          className={`w-1.5 h-1.5 rounded-full mt-1 ${alert ? "animate-pulse" : ""}`}
          style={{ background: alert ? "#f59e0b" : dotColor }}
        />
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-neutral-11 leading-none truncate ${wide ? "text-xl" : "text-2xl"}`}>
          {value}
        </p>
        <p className="text-[10px] font-semibold text-neutral-07 uppercase tracking-wider mt-1.5 truncate">
          {label}
        </p>
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
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-neutral-03 bg-white hover:shadow-sm hover:border-neutral-05 transition-all group"
    >
      <div className={`p-1.5 rounded-md ${color} transition-transform group-hover:scale-110 shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-xs font-medium text-neutral-09 truncate">{label}</span>
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

  return (
    <div className="space-y-5">

      {/* ── Header + Search ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-08" suppressHydrationWarning>
            {getGreeting()} 👋 Here&apos;s what&apos;s happening today.
          </p>
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

      {/* ── KPI Cards (single dense grid) ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard
          wide
          label="Total Revenue"
          value={`Rs.${orderStats.totalRevenue.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          dotColor="#10b981"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="Total Orders"
          value={orderStats.totalOrders}
          icon={ShoppingBag}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          dotColor="#3b82f6"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="Pending Orders"
          value={orderStats.pendingOrders}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          dotColor="#f59e0b"
          href={adminRoutes.orders}
          alert={orderStats.pendingOrders > 0}
          alertText={`${orderStats.pendingOrders} awaiting action`}
        />
        <KpiCard
          wide
          label="Avg. Order Value"
          value={`Rs.${orderStats.averageOrderValue.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={BarChart3}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          dotColor="#8b5cf6"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="Pending Payments"
          value={orderStats.pendingPayments}
          icon={CreditCard}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          dotColor="#f59e0b"
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
          dotColor="#ef4444"
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
          dotColor="#3b82f6"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="COD Orders"
          value={orderStats.paymentMethodBreakdown["COD"] ?? 0}
          icon={ShoppingBag}
          iconBg="bg-gray-50"
          iconColor="text-gray-600"
          dotColor="#9ca3af"
          href={adminRoutes.orders}
        />
        <KpiCard
          label="Total Products"
          value={productStats.totalProducts}
          icon={Package}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          dotColor="#6366f1"
          href={adminRoutes.products}
        />
        <KpiCard
          label="Active Products"
          value={productStats.activeProducts}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          dotColor="#10b981"
          href={adminRoutes.products}
        />
        <KpiCard
          label="Low Stock"
          value={productStats.lowStockProducts}
          icon={AlertTriangle}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          dotColor="#f97316"
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
          dotColor="#9ca3af"
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
          <BreakdownChart segments={orderDonutSegments} sublabel="orders" />
        </div>

        {/* Product status chart */}
        <div className="bg-white rounded-xl border border-neutral-03 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-11">Product Status Overview</h3>
            <Link href={adminRoutes.products} className="text-xs text-neutral-08 hover:text-neutral-11 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <BreakdownChart segments={productDonutSegments} sublabel="products" />
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-03 p-5">
        <h3 className="text-sm font-semibold text-neutral-11 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
