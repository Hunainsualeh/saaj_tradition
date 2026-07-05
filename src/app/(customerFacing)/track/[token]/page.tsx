import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { routes } from "@/lib/routing/routes";
import { getSiteContentMap } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) return { title: "Order Not Found" };
  return { title: `Order #${order.orderNumber} — Saaj Tradition` };
}

// ─── DATA FETCH ──────────────────────────────────────────────────────────────

async function getOrderByToken(token: string) {
  return prisma.order.findUnique({
    where: { trackingToken: token },
    select: {
      orderNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      delieveryName: true,
      deliveryEmail: true,
      deliveryStreetAddress: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryPostcode: true,
      deliveryCountry: true,
      shippingAmount: true,
      discountAmount: true,
      couponCode: true,
      totalPrice: true,
      orderItems: {
        select: {
          title: true,
          quantity: true,
          unitPrice: true,
          image: true,
          sizeLabel: true,
        },
      },
      cart: {
        select: {
          items: {
            select: {
              title: true,
              quantity: true,
              unitPrice: true,
              image: true,
              size: { select: { label: true } },
            },
          },
        },
      },
    },
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; step: number }
> = {
  PENDING:    { label: "Order Placed",       badgeClass: "bg-amber-50 text-amber-800",   step: 1 },
  PAID:       { label: "Payment Confirmed",  badgeClass: "bg-emerald-50 text-emerald-700", step: 2 },
  PROCESSING: { label: "Processing",         badgeClass: "bg-blue-50 text-blue-800",     step: 2 },
  SHIPPED:    { label: "Shipped",            badgeClass: "bg-violet-50 text-violet-800", step: 3 },
  DELIVERED:  { label: "Delivered",          badgeClass: "bg-emerald-50 text-emerald-700", step: 4 },
  CANCELLED:  { label: "Cancelled",          badgeClass: "bg-red-50 text-red-700",       step: 0 },
  REFUNDED:   { label: "Refunded",           badgeClass: "bg-neutral-100 text-neutral-600", step: 0 },
};

const FALLBACK_DELIVERY: Record<string, string> = {
  PENDING:    "7–10 business days",
  PAID:       "5–7 business days",
  PROCESSING: "5–7 business days",
  SHIPPED:    "2–4 business days",
  DELIVERED:  "Delivered",
  CANCELLED:  "—",
  REFUNDED:   "—",
};

function getEstimatedDelivery(status: string, siteContent: Record<string, string>): string {
  if (status === "DELIVERED") return "Delivered";
  if (status === "CANCELLED" || status === "REFUNDED") return "—";
  const key = `delivery_estimate_${status.toLowerCase()}`;
  return siteContent[key] || FALLBACK_DELIVERY[status] || "—";
}

const STEPS = ["Order Placed", "Processing", "Shipped", "Delivered"];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function OrderTrackingPage({ params }: Props) {
  const { token } = await params;
  const [order, siteContentResult] = await Promise.all([
    getOrderByToken(token),
    getSiteContentMap(),
  ]);

  if (!order) {
    notFound();
  }

  const siteContent = siteContentResult.success ? siteContentResult.data : {};
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["PENDING"];
  const estimatedDelivery = getEstimatedDelivery(order.status, siteContent);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  // Prefer orderItems snapshot; fall back to live cart items for legacy orders
  const displayItems =
    order.orderItems.length > 0
      ? order.orderItems.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          image: i.image,
          size: { label: i.sizeLabel ?? "—" },
        }))
      : order.cart.items;

  const total = Number(order.totalPrice);
  const discount = order.discountAmount ? Number(order.discountAmount) : 0;
  const shipping = order.shippingAmount ? Number(order.shippingAmount) : 0;
  const subtotal = displayItems.reduce(
    (s, i) => s + Number(i.unitPrice) * i.quantity,
    0,
  );

  const hasAddress = order.delieveryName || order.deliveryStreetAddress;

  return (
    <main className="min-h-[80vh] bg-neutral-01 py-10 md:py-16 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-[11px] uppercase tracking-[3px] text-neutral-08 mb-2">Saaj Tradition</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-12 tracking-tight">Order Tracker</h1>
          <p className="text-neutral-08 text-xs mt-2">
            Order #{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] text-center">
          <p className="text-[10px] uppercase tracking-[2px] text-neutral-08 mb-3">Current Status</p>
          <span className={`inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusCfg.badgeClass}`}>
            {statusCfg.label}
          </span>

          {!isCancelled && (
            <p className="text-neutral-09 text-xs mt-4">
              Estimated delivery: <span className="font-medium text-neutral-11">{estimatedDelivery}</span>
            </p>
          )}

          <p className="text-neutral-06 text-[10px] mt-2">
            Last updated: {new Date(order.updatedAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })} at {new Date(order.updatedAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Progress Steps */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-start relative">
              <div className="absolute top-3.5 left-[12%] right-[12%] h-0.5 bg-neutral-03" />
              <div
                className="absolute top-3.5 left-[12%] h-0.5 bg-neutral-12 transition-all duration-500"
                style={{ width: `${Math.max(0, (statusCfg.step - 1) / 3 * 76)}%` }}
              />

              {STEPS.map((label, idx) => {
                const stepNum = idx + 1;
                const done = stepNum < statusCfg.step;
                const active = stepNum === statusCfg.step;
                return (
                  <div key={label} className="flex flex-col items-center flex-1 relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      done
                        ? "bg-neutral-12 text-white"
                        : active
                        ? "bg-neutral-12 text-white ring-4 ring-neutral-12/10"
                        : "bg-neutral-03 text-neutral-07"
                    }`}>
                      {done ? "✓" : stepNum}
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center leading-tight ${
                      done || active ? "font-semibold text-neutral-12" : "text-neutral-07"
                    }`}>
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-12 mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {displayItems.map((item, i) => (
              <div key={i} className={`flex gap-3 items-center pb-3 ${i < displayItems.length - 1 ? "border-b border-neutral-03" : ""}`}>
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={52}
                    height={52}
                    className="w-13 h-13 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-12 truncate">{item.title}</p>
                  <p className="text-xs text-neutral-08">Size: {item.size.label} · Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-neutral-12 shrink-0">
                  Rs. {(Number(item.unitPrice) * item.quantity).toLocaleString("en-PK")}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-3 border-t border-neutral-03 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-08">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString("en-PK")}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-xs text-neutral-08">
                <span>Shipping</span>
                <span>Rs. {shipping.toLocaleString("en-PK")}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>−Rs. {discount.toLocaleString("en-PK")}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-neutral-12 pt-2 border-t border-neutral-03">
              <span>Total</span>
              <span>Rs. {total.toLocaleString("en-PK")}</span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-12 mb-3">Delivery Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-08 mb-1">Customer</p>
              <p className="text-sm font-medium text-neutral-12">{order.delieveryName || "—"}</p>
              <p className="text-xs text-neutral-08 mt-0.5">{order.deliveryEmail || "—"}</p>
            </div>
            {hasAddress && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-08 mb-1">Ship To</p>
                <p className="text-xs text-neutral-09 leading-relaxed">
                  {[
                    order.deliveryStreetAddress,
                    order.deliveryCity,
                    order.deliveryState,
                    order.deliveryPostcode,
                    order.deliveryCountry,
                  ].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-neutral-07 mb-3">
            This page shows real-time status. Check back for updates.
          </p>
          <Link href={routes.shop} className="text-xs font-medium text-neutral-12 hover:opacity-70 transition-opacity">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
