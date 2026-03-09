"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

import { GetAdminOrder } from "@/types/client";
import { AdminButton } from "../AdminButton";
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "../AdminSelect";
import { updateOrderStatus, updatePaymentStatus, recalculateOrderTotal } from "@/lib/server/actions/order-actions";
import { sendCustomEmailToOrderCustomer, previewStatusEmail } from "@/lib/server/actions/email-actions";
import { AlertTriangle, RefreshCw } from "lucide-react";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

type AdminOrderViewProps = {
  order: GetAdminOrder;
};

export function AdminOrderView(props: AdminOrderViewProps) {
  // === PROPS ===
  const { order } = props;

  const paymentMethodLabel =
    order.paymentMethod === "COD"
      ? "Cash on Delivery"
      : "PayFast";

  // === STATE ===
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [paymentStat, setPaymentStat] = useState(order.paymentStatus);
  const [sendEmail, setSendEmail] = useState(order.deliveryEmail ? true : false);
  const [statusMessage, setStatusMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [fixingTotal, setFixingTotal] = useState(false);
  const [displayedTotal, setDisplayedTotal] = useState(order.totalPrice);

  const handleExportPDF = () => {
    // build same html string as before (copy minus the printing part)
    const subtotalVal = order.cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const itemsHtml = order.cart.items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e5e5;">
            <div style="font-weight:500;">${item.title}</div>
            <div style="color:#6b7280;font-size:12px;">Size: ${item.size.label}</div>
          </td>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e5e5;text-align:center;color:#6b7280;">${item.quantity}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e5e5;text-align:right;color:#6b7280;">Rs.${Math.round(item.unitPrice)}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:500;">Rs.${Math.round(item.unitPrice * item.quantity)}</td>
        </tr>`,
      )
      .join("");

    const deliveryHtml = order.delieveryName
      ? `<div style="margin-bottom:24px;">
          <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:8px;">Delivery</h3>
          <p style="margin:2px 0;">${order.delieveryName}</p>
          ${order.deliveryEmail ? `<p style="margin:2px 0;">${order.deliveryEmail}</p>` : ""}
          ${order.deliveryPhone ? `<p style="margin:2px 0;">${order.deliveryPhone}</p>` : ""}
          ${order.deliveryStreetAddress ? `<p style="margin:2px 0;">${order.deliveryStreetAddress}</p>` : ""}
          ${[order.deliveryCity, order.deliveryState, order.deliveryPostcode].filter(Boolean).join(", ")}
          ${order.deliveryCountry ? `<p style="margin:2px 0;">${order.deliveryCountry}</p>` : ""}
        </div>`
      : "";

    const billingHtml = order.billingName
      ? `<div style="margin-bottom:24px;">
          <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:8px;">Billing</h3>
          <p style="margin:2px 0;">${order.billingName}</p>
          ${order.billingStreetAddress ? `<p style="margin:2px 0;">${order.billingStreetAddress}</p>` : ""}
          ${[order.billingCity, order.billingState, order.billingPostcode].filter(Boolean).join(", ")}
          ${order.billingCountry ? `<p style="margin:2px 0;">${order.billingCountry}</p>` : ""}
        </div>`
      : "";

    const couponHtml = order.couponCode
      ? `<tr>
          <td colspan="2" style="padding:4px 0;color:#16a34a;">Coupon (${order.couponCode}${order.discountPercent ? ` — ${order.discountPercent}%` : ""})</td>
          <td style="padding:4px 0;text-align:right;color:#16a34a;">${order.discountAmount ? `-Rs.${Math.round(order.discountAmount)}` : "—"}</td>
        </tr>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Order #${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; color: #111; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 700; }
    h2 { font-size: 15px; font-weight: 600; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div>
      <h1>Order #${order.orderNumber}</h1>
      <p style="color:#6b7280;font-size:12px;margin-top:4px;">
        ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString()}
      </p>
    </div>
    <div style="text-align:right;">
      <span style="display:inline-block;padding:4px 10px;background:#f3f4f6;border-radius:4px;font-size:12px;font-weight:600;">${order.status}</span>
      <br/>
      <span style="display:inline-block;margin-top:4px;padding:4px 10px;background:#f3f4f6;border-radius:4px;font-size:12px;font-weight:600;">${order.paymentStatus}</span>
    </div>
  </div>

  <div style="margin-bottom:24px;">
    <h2>Order Items</h2>
    <table>
      <thead>
        <tr style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">
          <th style="padding:6px 4px;text-align:left;border-bottom:2px solid #e5e5e5;">Item</th>
          <th style="padding:6px 4px;text-align:center;border-bottom:2px solid #e5e5e5;">Qty</th>
          <th style="padding:6px 4px;text-align:right;border-bottom:2px solid #e5e5e5;">Unit</th>
          <th style="padding:6px 4px;text-align:right;border-bottom:2px solid #e5e5e5;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
  </div>

  <div style="margin-left:auto;width:260px;margin-bottom:32px;">
    <table>
      <tbody>
        <tr>
          <td colspan="2" style="padding:4px 0;color:#6b7280;">Subtotal</td>
          <td style="padding:4px 0;text-align:right;">Rs.${Math.round(subtotalVal)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:4px 0;color:#6b7280;">Shipping</td>
          <td style="padding:4px 0;text-align:right;">${order.shippingAmount === 0 ? "Free" : `Rs.${Math.round(order.shippingAmount ?? 0)}`}</td>
        </tr>
        ${couponHtml}
        <tr style="border-top:2px solid #111;">
          <td colspan="2" style="padding:8px 0 0;font-weight:700;font-size:15px;">Total</td>
          <td style="padding:8px 0 0;text-align:right;font-weight:700;font-size:18px;">Rs.${Math.round(order.totalPrice)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
    ${deliveryHtml}
    ${billingHtml}
  </div>

  ${order.orderNote ? `
  <div style="margin-top:24px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;">
    <p style="font-size:12px;font-weight:600;color:#92400e;margin-bottom:4px;">Customer Note</p>
    <p style="font-size:13px;color:#111;white-space:pre-wrap;">${order.orderNote}</p>
  </div>` : ""}
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    }
  };

  const handleEmailOrder = async () => {
    setEmailSending(true);
    try {
      const preview = await previewStatusEmail(order.id, statusMessage || undefined);
      if (!preview.success) {
        toast.error("Failed to build email template");
        return;
      }
      const result = await sendCustomEmailToOrderCustomer(order.id, preview.data.subject, preview.data.html);
      if (result.success) {
        toast.success("Email sent to customer");
      } else {
        toast.error("Failed to send email");
      }
    } finally {
      setEmailSending(false);
    }
  };

  const handleOrderStatusChange = async (newStatus: string) => {
    const result = await updateOrderStatus(order.id, newStatus, {
      sendEmail,
      customMessage: statusMessage || undefined,
    });
    if (result.success) {
      setOrderStatus(result.data.status as typeof orderStatus);
      toast.success(`Order status updated to ${newStatus}${sendEmail && order.deliveryEmail ? " (email sent)" : ""}`);
    } else {
      toast.error("Failed to update order status");
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    const result = await updatePaymentStatus(order.id, newStatus);
    if (result.success) {
      setPaymentStat(result.data.paymentStatus as typeof paymentStat);
      toast.success(`Payment status updated to ${newStatus}`);
    } else {
      toast.error("Failed to update payment status");
    }
  };

  // === COMPUTED ===
  const subtotal = order.cart.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const shipping = order.shippingAmount ?? 0;
  const discount = order.discountAmount ?? 0;
  const computedTotal = Math.max(subtotal + shipping - discount, 0);
  const hasTotalMismatch = Math.abs(computedTotal - displayedTotal) > 0.01;

  const handleFixTotal = async () => {
    setFixingTotal(true);
    try {
      const result = await recalculateOrderTotal(order.id);
      if (result.success) {
        setDisplayedTotal(result.data);
        toast.success(`Order total updated to Rs.${Math.round(result.data)}`);
      } else {
        toast.error("Failed to recalculate total");
      }
    } finally {
      setFixingTotal(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-04 p-4 md:p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 border-b border-neutral-04 pb-4">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-semibold text-neutral-11">
            Order #{order.orderNumber}
          </h2>
          <p className="text-xs md:text-sm text-neutral-09 mt-1">
            Created: {new Date(order.createdAt).toLocaleDateString()} at{" "}
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <AdminButton variant="outline" onClick={handleExportPDF}>
            Export PDF
          </AdminButton>
          <AdminButton
            variant="default"
            onClick={handleEmailOrder}
            disabled={!order.deliveryEmail || emailSending}
            className="flex items-center gap-2"
          >
            {emailSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Mail size={14} />
            )}
            {emailSending ? "Loading…" : "Email to Customer"}
          </AdminButton>
        </div>
      </div>

      {/* Order Status */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-neutral-01 p-4 rounded">
            <p className="text-sm text-neutral-09 mb-2">Order Status</p>
            <AdminSelect value={orderStatus} onValueChange={handleOrderStatusChange}>
              <AdminSelectTrigger className="w-full">
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                {ORDER_STATUSES.map((s) => (
                  <AdminSelectItem key={s} value={s}>
                    {s}
                  </AdminSelectItem>
                ))}
              </AdminSelectContent>
            </AdminSelect>
          </div>
          <div className="bg-neutral-01 p-4 rounded">
            <p className="text-sm text-neutral-09 mb-2">Payment Status</p>
            <AdminSelect value={paymentStat} onValueChange={handlePaymentStatusChange}>
              <AdminSelectTrigger className="w-full">
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <AdminSelectItem key={s} value={s}>
                    {s}
                  </AdminSelectItem>
                ))}
              </AdminSelectContent>
            </AdminSelect>
          </div>
          <div className="bg-neutral-01 p-4 rounded">
            <p className="text-sm text-neutral-09 mb-1">Payment Method</p>
            <p className="font-semibold text-neutral-11">{paymentMethodLabel}</p>
          </div>
        </div>

        {/* Email notification row below status grid */}
        {order.deliveryEmail && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm text-blue-800 font-medium">
                Notify customer by email when status changes
              </span>
            </label>
            {sendEmail && (
              <input
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="Optional personal message for the customer…"
                className="flex-1 border border-blue-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            )}
          </div>
        )}
      </div>

      {order.orderNote && (
        <div>
          <h3 className="text-base md:text-lg font-semibold text-neutral-11 mb-3">
            Customer Note
          </h3>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded">
            <p className="text-sm text-neutral-11 italic whitespace-pre-wrap">
              {order.orderNote}
            </p>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-neutral-11 mb-3">
          Order Items
        </h3>
        <div className="space-y-3">
          {order.cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 md:gap-4 border border-neutral-04 rounded p-3 md:p-4"
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm md:text-base text-neutral-11 truncate">
                  {item.title}
                </h4>
                <p className="text-xs md:text-sm text-neutral-09">
                  Size: {item.size.label}
                </p>
                <p className="text-xs md:text-sm text-neutral-09">
                  Quantity: {item.quantity}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm md:text-base text-neutral-11">
                  Rs.{Math.round(item.unitPrice * item.quantity)}
                </p>
                <p className="text-xs md:text-sm text-neutral-09">
                  <span>x{item.quantity + " "}</span>
                  <span>Rs.{Math.round(item.unitPrice)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-neutral-04 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-neutral-10">
            <span>Subtotal</span>
            <span>Rs.{Math.round(subtotal)}</span>
          </div>

          {order.shippingAmount != null && (
            <div className="flex justify-between text-sm text-neutral-10">
              <span>Shipping</span>
              <span>
                {order.shippingAmount === 0
                  ? "Free"
                  : `Rs.${Math.round(order.shippingAmount ?? 0)}`}
              </span>
            </div>
          )}

          {order.couponCode && (
            <div className="flex justify-between text-sm text-green-700">
              <span>
                Coupon ({order.couponCode}
                {order.discountPercent ? ` — ${order.discountPercent}%` : ""})
              </span>
              <span>
                {order.discountAmount
                  ? `-Rs.${Math.round(order.discountAmount ?? 0)}`
                  : "—"}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-neutral-04">
            <span className="text-base font-bold text-neutral-11">Total</span>
            <span className="text-xl md:text-2xl font-bold text-neutral-11">
              Rs.{Math.round(displayedTotal)}
            </span>
          </div>

          {/* Total mismatch warning */}
          {hasTotalMismatch && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Stored total <strong>Rs.{Math.round(displayedTotal)}</strong> doesn&apos;t match
                  the computed total from items <strong>Rs.{Math.round(computedTotal)}</strong>.
                  This order may have been created with outdated prices.
                </p>
              </div>
              <AdminButton
                variant="outline"
                onClick={handleFixTotal}
                disabled={fixingTotal}
                className="shrink-0 flex items-center gap-2 text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                {fixingTotal ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {fixingTotal ? "Fixing…" : "Fix Total"}
              </AdminButton>
            </div>
          )}
        </div>
      </div>

      {/* Delivery & Billing Information */}
      {(order.delieveryName || order.billingName) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Information */}
          {order.delieveryName && (
            <div>
              <h3 className="text-base font-semibold text-neutral-11 mb-3">
                Delivery Information
              </h3>
              <div className="bg-neutral-01 p-3 md:p-4 rounded space-y-1.5">
                <p className="text-sm text-neutral-10">
                  <span className="font-medium text-neutral-09 text-xs uppercase tracking-wide">
                    Name
                  </span>
                  <br />
                  <span className="text-neutral-11">{order.delieveryName}</span>
                </p>
                {order.deliveryEmail && (
                  <p className="text-sm text-neutral-10">
                    <span className="font-medium text-neutral-09 text-xs uppercase tracking-wide">
                      Email
                    </span>
                    <br />
                    <span className="text-neutral-11">
                      {order.deliveryEmail}
                    </span>
                  </p>
                )}
                {order.deliveryPhone && (
                  <p className="text-sm text-neutral-10">
                    <span className="font-medium text-neutral-09 text-xs uppercase tracking-wide">
                      Phone
                    </span>
                    <br />
                    <span className="text-neutral-11">
                      {order.deliveryPhone}
                    </span>
                  </p>
                )}
                {order.deliveryStreetAddress && (
                  <p className="text-sm text-neutral-10">
                    <span className="font-medium text-neutral-09 text-xs uppercase tracking-wide">
                      Address
                    </span>
                    <br />
                    <span className="text-neutral-11">
                      {order.deliveryStreetAddress}
                    </span>
                    <br />
                    <span className="text-neutral-11">
                      {[
                        order.deliveryCity,
                        order.deliveryState,
                        order.deliveryPostcode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    {order.deliveryCountry && (
                      <>
                        <br />
                        <span className="text-neutral-11">
                          {order.deliveryCountry}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Billing Information */}
          {order.billingName && (
            <div>
              <h3 className="text-base font-semibold text-neutral-11 mb-3">
                Billing Information
              </h3>
              <div className="bg-neutral-01 p-3 md:p-4 rounded space-y-1.5">
                <p className="text-sm text-neutral-10">
                  <span className="font-medium text-neutral-09 text-xs uppercase tracking-wide">
                    Name
                  </span>
                  <br />
                  <span className="text-neutral-11">{order.billingName}</span>
                </p>
                {order.billingStreetAddress && (
                  <p className="text-sm text-neutral-10">
                    <span className="font-medium text-neutral-09 text-xs uppercase tracking-wide">
                      Address
                    </span>
                    <br />
                    <span className="text-neutral-11">
                      {order.billingStreetAddress}
                    </span>
                    <br />
                    <span className="text-neutral-11">
                      {[
                        order.billingCity,
                        order.billingState,
                        order.billingPostcode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    {order.billingCountry && (
                      <>
                        <br />
                        <span className="text-neutral-11">
                          {order.billingCountry}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
