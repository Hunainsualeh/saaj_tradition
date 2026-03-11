import Image from "next/image";
import Link from "next/link";

import { getButtonStyles } from "@/components";
import { routes } from "@/lib/routing/routes";
import { OrderSuccessData } from "@/lib/server/queries/order-queries";

type CheckoutSuccessUIProps = {
  order: OrderSuccessData;
};

export function CheckoutSuccessUI({ order }: CheckoutSuccessUIProps) {
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shipping = order.shippingAmount ?? 0;
  const discount = order.discountAmount ?? 0;
  const bgImage = order.items[0]?.image ?? null;

  const deliveryLines = [
    order.delieveryName,
    order.deliveryEmail,
    order.deliveryPhone,
    order.deliveryStreetAddress,
    [order.deliveryCity, order.deliveryState, order.deliveryPostcode].filter(Boolean).join(", "),
    order.deliveryCountry,
  ].filter(Boolean) as string[];

  const billingLines = [
    order.billingName,
    order.billingStreetAddress,
    [order.billingCity, order.billingState, order.billingPostcode].filter(Boolean).join(", "),
    order.billingCountry,
  ].filter(Boolean) as string[];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* ── Background ── */}
      {bgImage ? (
        <div className="fixed inset-0 -z-10">
          <Image src={bgImage} alt="" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
        </div>
      ) : (
        <div className="fixed inset-0 -z-10 bg-[#f8f5f0]" />
      )}

      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">

        {/* ── Header ── */}
        <div className="mb-10 text-center">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/assets/logo/Saaj Tradition Golden.png"
              alt="Saaj Tradition"
              width={120}
              height={48}
              className="object-contain"
            />
          </div>

          <h1
            className="text-5xl md:text-7xl font-black tracking-widest uppercase text-neutral-11"
            style={{ letterSpacing: "0.12em" }}
          >
            Thank You!
          </h1>
          <p className="mt-3 text-xs md:text-sm tracking-[0.25em] uppercase text-neutral-08 font-medium">
            Your order has been received
          </p>

          <div className="mt-4 flex justify-center">
            <div className="w-12 h-px bg-neutral-11 opacity-30" />
            <div className="mx-3 w-2 h-2 rotate-45 border border-neutral-11 opacity-40 -mt-[3px]" />
            <div className="w-12 h-px bg-neutral-11 opacity-30" />
          </div>
        </div>

        {/* ── Order Meta ── */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-04 border border-neutral-04 rounded-lg overflow-hidden bg-white/70 backdrop-blur-sm">
          <MetaCell label="Order Number" value={`#${order.orderNumber}`} />
          <MetaCell
            label="Date"
            value={new Date(order.createdAt).toLocaleDateString("en-PK", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          />
          <MetaCell label="Total" value={`Rs.${Math.round(order.totalPrice)}`} />
          <MetaCell
            label="Payment Method"
            value={order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
          />
        </div>

        {/* ── Tracking Info ── */}
        {order.trackingToken && (
          <div className="mb-8 rounded-lg border border-neutral-04 bg-white/70 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-04">
              <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-09">
                Order Tracking
              </h2>
            </div>
            <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-08 mb-1">Tracking ID</p>
                <p className="text-sm font-mono font-semibold text-neutral-11 break-all">{order.trackingToken}</p>
              </div>
              <div className="flex-1 sm:border-l sm:border-neutral-04 sm:pl-4">
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-08 mb-1">Order Code</p>
                <p className="text-sm font-mono font-semibold text-neutral-11">#{order.orderNumber}</p>
              </div>
              <p className="text-xs text-neutral-07 sm:max-w-[220px]">
                Use your Tracking ID on the <span className="font-semibold">Track Order</span> page to follow your shipment.
              </p>
            </div>
          </div>
        )}

        {/* ── Order Items ── */}
        <section className="mb-6 rounded-lg border border-neutral-04 overflow-hidden bg-white/70 backdrop-blur-sm">
          <div className="px-4 py-3 border-b border-neutral-04">
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-09">
              Order Items
            </h2>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] px-4 py-2 bg-neutral-01 text-xs font-semibold uppercase tracking-widest text-neutral-08 border-b border-neutral-04">
            <span>Product</span>
            <span className="text-center px-6">Qty</span>
            <span className="text-right px-6">Price</span>
            <span className="text-right">Total</span>
          </div>

          <div className="divide-y divide-neutral-04">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-4 py-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto]"
              >
                {/* Product */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden border border-neutral-04">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-neutral-11 truncate">{item.title}</p>
                    <p className="text-xs text-neutral-08">Size: {item.size.label}</p>
                  </div>
                </div>
                {/* Qty */}
                <div className="text-center text-sm text-neutral-10 sm:px-6 shrink-0">
                  <span className="sm:hidden text-xs text-neutral-08">×</span>{item.quantity}
                </div>
                {/* Unit price */}
                <div className="hidden sm:block text-right text-sm text-neutral-09 px-6">
                  Rs.{Math.round(item.unitPrice)}
                </div>
                {/* Line total */}
                <div className="text-right text-sm font-semibold text-neutral-11 shrink-0">
                  Rs.{Math.round(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Totals + Addresses ── */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Addresses */}
          <div className="space-y-4">
            {deliveryLines.length > 0 && (
              <AddressBlock title="Shipping Address" lines={deliveryLines} />
            )}
            {billingLines.length > 0 && (
              <AddressBlock title="Billing Address" lines={billingLines} />
            )}
          </div>

          {/* Cart totals */}
          <div className="rounded-lg border border-neutral-04 overflow-hidden bg-white/70 backdrop-blur-sm self-start">
            <div className="px-4 py-3 border-b border-neutral-04">
              <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-09">
                Cart Totals
              </h2>
            </div>
            <div className="px-4 py-4 space-y-2.5 text-sm">
              <TotalRow label="Subtotal" value={`Rs.${Math.round(subtotal)}`} />
              <TotalRow
                label="Shipping"
                value={shipping === 0 ? "Free" : `Rs.${Math.round(shipping)}`}
              />
              {order.couponCode && discount > 0 && (
                <TotalRow
                  label={`Coupon (${order.couponCode}${order.discountPercent ? ` −${order.discountPercent}%` : ""})`}
                  value={`−Rs.${Math.round(discount)}`}
                  highlight="green"
                />
              )}
              <div className="pt-2 border-t border-neutral-04">
                <TotalRow
                  label="Total"
                  value={`Rs.${Math.round(order.totalPrice)}`}
                  bold
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {order.trackingToken && (
            <Link
              href={`/track/${order.trackingToken}`}
              className={getButtonStyles("dark", "justify-center px-8")}
            >
              Track My Order
            </Link>
          )}
          <Link
            href={routes.shop}
            className={getButtonStyles(order.trackingToken ? "light" : "dark", "justify-center px-8")}
          >
            Continue Shopping
          </Link>
          <Link
            href={routes.home}
            className={getButtonStyles("light", "justify-center px-8")}
          >
            Go Home
          </Link>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-08 mb-1">{label}</p>
      <p className="text-sm font-semibold text-neutral-11">{value}</p>
    </div>
  );
}

function AddressBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-neutral-04 overflow-hidden bg-white/70 backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-neutral-04">
        <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-09">{title}</h2>
      </div>
      <div className="px-4 py-4 space-y-0.5">
        {lines.map((l, i) => (
          <p key={i} className="text-sm text-neutral-11">{l}</p>
        ))}
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  bold = false,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: "green";
}) {
  const colorClass = highlight === "green" ? "text-green-700" : bold ? "text-neutral-11" : "text-neutral-10";
  return (
    <div className={`flex justify-between gap-4 ${colorClass}`}>
      <span className={bold ? "font-bold text-base" : ""}>{label}</span>
      <span className={bold ? "font-bold text-base" : ""}>{value}</span>
    </div>
  );
}

