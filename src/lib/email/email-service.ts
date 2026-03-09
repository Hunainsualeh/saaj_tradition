"use server";

import { prisma } from "@/lib/prisma";
import { EmailTemplateType } from "@prisma/client";
import { transporter, EMAIL_FROM, ADMIN_EMAIL } from "./transporter";
import {
  ORDER_CONFIRMATION_TEMPLATE,
  ORDER_ADMIN_NOTIFICATION_TEMPLATE,
  ORDER_STATUS_UPDATE_TEMPLATE,
  NEWSLETTER_TEMPLATE,
  PRODUCT_UPDATE_TEMPLATE,
  COLLECTION_UPDATE_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  THANK_YOU_EMAIL_TEMPLATE,
} from "./templates";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

type OrderItem = {
  title: string;
  quantity: number;
  unitPrice: number;
  image: string;
  size: string;
};

function buildOrderItemsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ece8;border-radius:8px;margin-bottom:12px;">
      <tr>
        <td class="item-image" style="padding:12px;width:70px;vertical-align:top;">
          <img src="${item.image}" alt="${item.title}" width="58" height="58" style="width:58px;height:58px;object-fit:cover;border-radius:6px;" />
        </td>
        <td style="padding:12px;vertical-align:middle;">
          <p style="font-weight:600;color:#1a1a2e;font-size:14px;margin-bottom:4px;">${item.title}</p>
          <p style="font-size:12px;color:#888;margin-bottom:2px;">Size: ${item.size}</p>
          <p style="font-size:12px;color:#888;">Qty: ${item.quantity} × Rs. ${Math.round(item.unitPrice)}</p>
        </td>
        <td align="right" style="padding:12px;vertical-align:middle;">
          <p style="font-weight:700;color:#1a1a2e;font-size:15px;">Rs. ${Math.round(item.unitPrice * item.quantity)}</p>
        </td>
      </tr>
    </table>
  `,
    )
    .join("");
}

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: "Your order has been received and is awaiting processing.",
  PAID: "Payment received. Your order is confirmed!",
  PROCESSING: "We're preparing your order with care.",
  SHIPPED: "Your order is on its way. Sit back and relax!",
  DELIVERED: "Your order has been delivered. Enjoy!",
  CANCELLED: "Your order has been cancelled. Contact us if you have questions.",
  REFUNDED: "Your refund has been processed and will reflect shortly.",
};

function statusBadgeHtml(status: string): string {
  const colors: Record<string, { bg: string; color: string }> = {
    PENDING:    { bg: "#fef3c7", color: "#92400e" },
    PAID:       { bg: "#d1fae5", color: "#065f46" },
    PROCESSING: { bg: "#dbeafe", color: "#1e40af" },
    SHIPPED:    { bg: "#ede9fe", color: "#5b21b6" },
    DELIVERED:  { bg: "#d1fae5", color: "#065f46" },
    CANCELLED:  { bg: "#fee2e2", color: "#991b1b" },
    REFUNDED:   { bg: "#f3f4f6", color: "#374151" },
  };
  const c = colors[status] ?? { bg: "#f3f4f6", color: "#374151" };
  return `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:${c.bg};color:${c.color};">${status}</span>`;
}

/** Replace all {{variable}} occurrences in a template string */
function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{{${key}}}`;
  });
}

const STORE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");
const STORE_EMAIL = process.env.EMAIL_USER ?? "saajtraditionbahawalpur@gmail.com";

async function getCustomTemplate(type: EmailTemplateType) {
  return prisma.emailTemplate.findFirst({
    where: { type, isActive: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function resolveTemplate(
  type: EmailTemplateType,
  defaultTemplate: { subject: string; html: string },
): Promise<{ subject: string; html: string }> {
  const custom = await getCustomTemplate(type);
  if (custom) {
    return { subject: custom.subject, html: custom.htmlContent };
  }
  return defaultTemplate;
}

// ─── ORDER CONFIRMATION ───────────────────────────────────────────────────────

export type SendOrderConfirmationInput = {
  to: string;
  customerName: string;
  orderNumber: number;
  orderDate: string;
  orderStatus: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
  total: number;
  deliveryAddress?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  orderId: string;
  trackingUrl?: string;
  trackingToken?: string;
};

function buildTrackingIdRow(trackingToken?: string): string {
  if (!trackingToken) return "";
  return `<tr><td style="padding:8px 16px;text-align:center;border-top:1px solid rgba(0,0,0,0.1);" colspan="3">
    <p style="font-size:10px;font-weight:700;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;margin-bottom:4px;">Tracking ID</p>
    <p style="font-size:13px;font-weight:600;color:#2c2c2c;font-family:monospace;letter-spacing:1px;word-break:break-all;">${trackingToken}</p>
  </td></tr>`;
}

export async function sendOrderConfirmationEmail(input: SendOrderConfirmationInput) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const { subject, html } = await resolveTemplate(
    EmailTemplateType.ORDER_CONFIRMATION,
    ORDER_CONFIRMATION_TEMPLATE,
  );

  const deliveryLines = input.deliveryAddress
    ? [
        input.deliveryAddress.name,
        input.deliveryAddress.street,
        [input.deliveryAddress.city, input.deliveryAddress.state, input.deliveryAddress.postcode]
          .filter(Boolean)
          .join(", "),
        input.deliveryAddress.country,
      ]
        .filter(Boolean)
        .join("<br/>")
    : "—";

  const deliverySection = input.deliveryAddress
    ? `<div style="margin-top:28px;padding:20px;background:#faf8f5;border-radius:8px;border-left:3px solid #c9a84c;">
        <p style="font-size:10px;font-weight:700;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;margin-bottom:8px;">Delivery Address</p>
        <p style="font-size:14px;color:#444;line-height:1.8;">${deliveryLines}</p>
       </div>`
    : "";

  const discountRow = input.discount && input.discount > 0
    ? `<tr><td style="padding:8px 0;color:#16a34a;font-size:14px;">Discount${input.couponCode ? ` (${input.couponCode})` : ""}</td><td align="right" style="padding:8px 0;font-size:14px;color:#16a34a;">−Rs. ${Math.round(input.discount)}</td></tr>`
    : "";

  const vars: Record<string, string> = {
    customerName: input.customerName,
    orderNumber: input.orderNumber.toString(),
    orderDate: input.orderDate,
    orderStatus: input.orderStatus,
    orderStatusBadge: statusBadgeHtml(input.orderStatus),
    items: buildOrderItemsHtml(input.items),
    subtotal: Math.round(input.subtotal).toString(),
    shipping: input.shipping === 0 ? "Free" : `${Math.round(input.shipping)}`,
    discountRow,
    total: Math.round(input.total).toString(),
    deliverySection,
    storeUrl: STORE_URL,
    storeEmail: STORE_EMAIL,
    adminOrderUrl: `${STORE_URL}/admin/orders/${input.orderId}`,
    trackingUrl: input.trackingUrl ?? STORE_URL,
    trackingIdRow: buildTrackingIdRow(input.trackingToken),
  };

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: input.to,
    subject: applyVariables(subject, vars),
    html: applyVariables(html, vars),
  });
}

// ─── ADMIN ORDER NOTIFICATION ─────────────────────────────────────────────────

export async function sendAdminOrderNotificationEmail(input: SendOrderConfirmationInput & { customerPhone?: string; customerEmail: string }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const { subject, html } = await resolveTemplate(
    EmailTemplateType.ORDER_ADMIN_NOTIFICATION,
    ORDER_ADMIN_NOTIFICATION_TEMPLATE,
  );

  const deliveryLines = input.deliveryAddress
    ? [
        input.deliveryAddress.name,
        input.deliveryAddress.street,
        [input.deliveryAddress.city, input.deliveryAddress.state, input.deliveryAddress.postcode]
          .filter(Boolean)
          .join(", "),
        input.deliveryAddress.country,
      ]
        .filter(Boolean)
        .join("<br/>")
    : "—";

  const deliverySection = `<div style="margin-top:28px;padding:20px;background:#faf8f5;border-radius:8px;border-left:3px solid #c9a84c;">
    <p style="font-size:10px;font-weight:700;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;margin-bottom:8px;">Delivery Address</p>
    <p style="font-size:14px;color:#444;line-height:1.8;">${deliveryLines || "Not provided yet"}</p>
  </div>`;

  const discountRow = input.discount && input.discount > 0
    ? `<tr><td style="padding:8px 0;color:#16a34a;font-size:14px;">Discount${input.couponCode ? ` (${input.couponCode})` : ""}</td><td align="right" style="padding:8px 0;font-size:14px;color:#16a34a;">−Rs. ${Math.round(input.discount)}</td></tr>`
    : "";

  const vars: Record<string, string> = {
    customerName: input.customerName || "Customer",
    customerEmail: input.customerEmail || "—",
    customerPhone: input.customerPhone || "—",
    orderNumber: input.orderNumber.toString(),
    orderDate: input.orderDate,
    orderStatusBadge: statusBadgeHtml(input.orderStatus),
    items: buildOrderItemsHtml(input.items),
    subtotal: Math.round(input.subtotal).toString(),
    shipping: input.shipping === 0 ? "Free" : `${Math.round(input.shipping)}`,
    discountRow,
    total: Math.round(input.total).toString(),
    deliverySection,
    adminOrderUrl: `${STORE_URL}/admin/orders/${input.orderId}`,
    storeUrl: STORE_URL,
    storeEmail: STORE_EMAIL,
    trackingUrl: input.trackingUrl ?? STORE_URL,
    trackingIdRow: buildTrackingIdRow(input.trackingToken),
  };

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    subject: applyVariables(subject, vars),
    html: applyVariables(html, vars),
  });
}

// ─── ORDER STATUS UPDATE ──────────────────────────────────────────────────────

export async function sendOrderStatusUpdateEmail(input: {
  to: string;
  customerName: string;
  orderNumber: number;
  orderStatus: string;
  customMessage?: string;
  orderId: string;
  trackingUrl?: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const { subject, html } = await resolveTemplate(
    EmailTemplateType.ORDER_STATUS_UPDATE,
    ORDER_STATUS_UPDATE_TEMPLATE,
  );

  const customMessage = input.customMessage
    ? `<div style="margin-top:20px;padding:16px;background:#faf8f5;border-left:3px solid #c9a84c;border-radius:4px;"><p style="font-size:14px;color:#444;line-height:1.8;">${input.customMessage}</p></div>`
    : "";

  const vars: Record<string, string> = {
    customerName: input.customerName,
    orderNumber: input.orderNumber.toString(),
    orderStatus: input.orderStatus,
    orderStatusBadge: statusBadgeHtml(input.orderStatus),
    statusMessage: STATUS_MESSAGES[input.orderStatus] ?? "",
    customMessage,
    storeUrl: STORE_URL,
    storeEmail: STORE_EMAIL,
    trackingUrl: input.trackingUrl ?? STORE_URL,
  };

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: input.to,
    subject: applyVariables(subject, vars),
    html: applyVariables(html, vars),
  });
}

// helper that builds the same subject/html but does not send, used for admin previews
export async function renderOrderStatusUpdateEmail(input: {
  customerName: string;
  orderNumber: number;
  orderStatus: string;
  customMessage?: string;
  orderId: string;
  trackingUrl?: string;
}): Promise<{ subject: string; html: string }> {
  const { subject, html } = await resolveTemplate(
    EmailTemplateType.ORDER_STATUS_UPDATE,
    ORDER_STATUS_UPDATE_TEMPLATE,
  );

  const customMessage = input.customMessage
    ? `<div style="margin-top:20px;padding:16px;background:#faf8f5;border-left:3px solid #c9a84c;border-radius:4px;"><p style="font-size:14px;color:#444;line-height:1.8;">${input.customMessage}</p></div>`
    : "";

  const vars: Record<string, string> = {
    customerName: input.customerName,
    orderNumber: input.orderNumber.toString(),
    orderStatus: input.orderStatus,
    orderStatusBadge: statusBadgeHtml(input.orderStatus),
    statusMessage: STATUS_MESSAGES[input.orderStatus] ?? "",
    customMessage,
    storeUrl: STORE_URL,
    storeEmail: STORE_EMAIL,
    trackingUrl: input.trackingUrl ?? STORE_URL,
  };

  return {
    subject: applyVariables(subject, vars),
    html: applyVariables(html, vars),
  };
}

// ─── NEWSLETTER / PRODUCT / COLLECTION ───────────────────────────────────────

export async function sendNewsletterEmail(input: {
  to: string;
  subscriberName: string;
  emailHeading: string;
  subject: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const { subject: subjectTpl, html } = await resolveTemplate(
    EmailTemplateType.NEWSLETTER,
    NEWSLETTER_TEMPLATE,
  );

  const imageSection = input.imageUrl
    ? `<div style="margin:24px 0;border-radius:8px;overflow:hidden;"><img src="${input.imageUrl}" alt="" style="width:100%;height:auto;max-height:320px;object-fit:cover;" /></div>`
    : "";

  const vars: Record<string, string> = {
    subscriberName: input.subscriberName || "Valued Customer",
    emailHeading: input.emailHeading,
    subject: input.subject,
    body: input.body,
    imageSection,
    ctaText: input.ctaText ?? "Shop Now",
    ctaUrl: input.ctaUrl ?? STORE_URL,
    storeUrl: STORE_URL,
    unsubscribeUrl: `${STORE_URL}/unsubscribe`,
  };

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: input.to,
    subject: applyVariables(subjectTpl, vars),
    html: applyVariables(html, vars),
  });
}

export async function sendProductUpdateEmail(input: {
  to: string;
  productName: string;
  productDescription: string;
  productPrice: number;
  productImageUrl?: string;
  productUrl: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const { subject, html } = await resolveTemplate(
    EmailTemplateType.PRODUCT_UPDATE,
    PRODUCT_UPDATE_TEMPLATE,
  );

  const productImageSection = input.productImageUrl
    ? `<img src="${input.productImageUrl}" alt="${input.productName}" style="width:100%;height:220px;object-fit:cover;" />`
    : "";

  const vars: Record<string, string> = {
    productName: input.productName,
    productDescription: input.productDescription,
    productPrice: input.productPrice.toFixed(2),
    productImageSection,
    productUrl: input.productUrl,
    storeUrl: STORE_URL,
    unsubscribeUrl: `${STORE_URL}/unsubscribe`,
  };

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: input.to,
    subject: applyVariables(subject, vars),
    html: applyVariables(html, vars),
  });
}

export async function sendCollectionUpdateEmail(input: {
  to: string;
  collectionName: string;
  collectionDescription: string;
  collectionImageUrl?: string;
  collectionUrl: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const { subject, html } = await resolveTemplate(
    EmailTemplateType.COLLECTION_UPDATE,
    COLLECTION_UPDATE_TEMPLATE,
  );

  const collectionImageSection = input.collectionImageUrl
    ? `<img src="${input.collectionImageUrl}" alt="${input.collectionName}" style="width:100%;height:240px;object-fit:cover;" />`
    : "";

  const vars: Record<string, string> = {
    collectionName: input.collectionName,
    collectionDescription: input.collectionDescription,
    collectionImageSection,
    collectionUrl: input.collectionUrl,
    storeUrl: STORE_URL,
    unsubscribeUrl: `${STORE_URL}/unsubscribe`,
  };

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: input.to,
    subject: applyVariables(subject, vars),
    html: applyVariables(html, vars),
  });
}

// ─── BROADCAST TO ALL NEWSLETTER SUBSCRIBERS ────────────────────────────────

export async function broadcastNewsletter(input: {
  emailHeading: string;
  subject: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true },
  });

  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      sendNewsletterEmail({
        to: sub.email,
        subscriberName: sub.name ?? "Valued Customer",
        ...input,
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed, total: subscribers.length };
}

export async function broadcastProductUpdate(input: {
  productName: string;
  productDescription: string;
  productPrice: number;
  productImageUrl?: string;
  productUrl: string;
}) {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true },
  });

  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      sendProductUpdateEmail({ to: sub.email, ...input }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, total: subscribers.length };
}

export async function broadcastCollectionUpdate(input: {
  collectionName: string;
  collectionDescription: string;
  collectionImageUrl?: string;
  collectionUrl: string;
}) {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true },
  });

  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      sendCollectionUpdateEmail({ to: sub.email, ...input }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, total: subscribers.length };
}

// ─── SEND CUSTOM EMAIL TO SINGLE ADDRESS ────────────────────────────────────

export async function sendCustomEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

// ─── WELCOME EMAIL (new subscriber) ─────────────────────────────────────────

export async function sendWelcomeEmail(input: {
  to: string;
  name?: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const subscriberName = input.name ?? "Valued Customer";
  const html = WELCOME_EMAIL_TEMPLATE.html
    .replace(/\{\{subscriberName\}\}/g, subscriberName)
    .replace(/\{\{storeUrl\}\}/g, STORE_URL)
    .replace(/\{\{unsubscribeUrl\}\}/g, `${STORE_URL}/unsubscribe`);
  const subject = WELCOME_EMAIL_TEMPLATE.subject;

  await transporter.sendMail({ from: EMAIL_FROM, to: input.to, subject, html });
}

// ─── THANK-YOU EMAIL (to an existing order customer) ────────────────────────

export async function sendThankYouEmail(input: {
  to: string;
  customerName: string;
  orderNumber?: number | string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const html = THANK_YOU_EMAIL_TEMPLATE.html
    .replace(/\{\{customerName\}\}/g, input.customerName)
    .replace(/\{\{orderNumber\}\}/g, String(input.orderNumber ?? ""))
    .replace(/\{\{storeUrl\}\}/g, STORE_URL);
  const subject = THANK_YOU_EMAIL_TEMPLATE.subject;

  await transporter.sendMail({ from: EMAIL_FROM, to: input.to, subject, html });
}
