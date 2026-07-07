"use server";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
  sendOrderStatusUpdateEmail,
} from "@/lib/email/email-service";
import { EmailTemplateType } from "@prisma/client";
import { headers } from "next/headers";

import { wrapServerCall } from "../helpers";
import { ServerActionResponse } from "@/types/server";
import { getCurrentAdmin } from "./admin-auth-actions";
import { CACHE_TAG_CART } from "@/lib/constants/cache-tags";
import { rateLimitOrderEmail, rateLimitUnsubscribe } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site-url";


/** Verify the caller is an authenticated admin; throws if not */
async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized: admin session required");
  return admin;
}

/** Get the admin notification email from SiteContent, falling back to EMAIL_USER env var */
async function getAdminNotificationEmail(): Promise<string> {
  try {
    const record = await prisma.siteContent.findUnique({
      where: { key: "admin_notification_email" },
      select: { value: true },
    });
    if (record?.value) return record.value;
  } catch {
    // ignore - fall through to env fallback
  }
  return process.env.EMAIL_USER ?? "";
}

const STORE_URL = getSiteUrl();

/** Fetch full order data and send confirmation emails to both customer & admin */
export async function sendOrderConfirmationEmails(
  orderId: string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    // Bound abuse of this exposed, system-callable action (see rateLimitOrderEmail).
    // Silent no-op when exceeded so the queue doesn't get stuck retrying.
    const rl = await rateLimitOrderEmail(orderId);
    if (!rl.allowed) {
      console.warn(`[Email] Order-email rate limit hit for ${orderId} (confirmation) — skipping`);
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            // no size join needed — sizeLabel is stored directly on OrderItem
          },
        },
        // Legacy fallback for orders without orderItems
        cart: {
          include: {
            items: {
              include: {
                size: { select: { label: true } },
              },
            },
          },
        },
      },
    });

    if (!order) throw new Error("Order not found");

    const rawItems =
      order.orderItems.length > 0
        ? order.orderItems.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            image: item.image,
            size: item.sizeLabel,
          }))
        : order.cart.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            image: item.image,
            size: item.size.label,
          }));

    const items = rawItems;

    // recompute values directly so we never rely on potentially stale/wrong order.totalPrice
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const shipping = order.shippingAmount ? Number(order.shippingAmount) : 0;
    const discount = order.discountAmount ? Number(order.discountAmount) : 0;
    const total = Math.max(subtotal - discount + shipping, 0);

    const deliveryAddress = order.delieveryName
      ? {
          name: order.delieveryName ?? undefined,
          street: order.deliveryStreetAddress ?? undefined,
          city: order.deliveryCity ?? undefined,
          state: order.deliveryState ?? undefined,
          postcode: order.deliveryPostcode ?? undefined,
          country: order.deliveryCountry ?? undefined,
        }
      : undefined;

    const baseInput = {
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-PK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      orderStatus: order.status,
      items,
      subtotal,
      shipping,
      discount: discount > 0 ? discount : undefined,
      couponCode: order.couponCode ?? undefined,
      total,
      deliveryAddress,
      orderId: order.id,
      trackingUrl: order.trackingToken
        ? `${STORE_URL}/track/${order.trackingToken}`
        : undefined,
      trackingToken: order.trackingToken ?? undefined,
    };

    const customerEmail = order.deliveryEmail;

    // Send customer email
    if (customerEmail) {
      await sendOrderConfirmationEmail({
        ...baseInput,
        to: customerEmail,
        customerName: order.delieveryName ?? "Valued Customer",
      }).catch((err) => {
        console.error("[Email] Failed to send customer order confirmation:", err);
      });
    }

    // Send admin notification to configurable admin email
    const adminEmail = await getAdminNotificationEmail();
    if (adminEmail) {
      await sendAdminOrderNotificationEmail({
        ...baseInput,
        customerName: order.delieveryName ?? "Customer",
        customerEmail: customerEmail ?? "—",
        customerPhone: order.deliveryPhone ?? undefined,
        to: adminEmail,
        trackingUrl: baseInput.trackingUrl,
      }).catch((err) => {
        console.error("[Email] Failed to send admin order notification:", err);
      });
    }
  });
}

/** Send a status update email to the customer */
export async function sendOrderStatusEmail(
  orderId: string,
  customMessage?: string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    const rl = await rateLimitOrderEmail(orderId);
    if (!rl.allowed) {
      console.warn(`[Email] Order-email rate limit hit for ${orderId} (status) — skipping`);
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        status: true,
        deliveryEmail: true,
        delieveryName: true,
        trackingToken: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (!order.deliveryEmail) throw new Error("No customer email on this order");

    await sendOrderStatusUpdateEmail({
      to: order.deliveryEmail,
      customerName: order.delieveryName ?? "Valued Customer",
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      customMessage,
      orderId,
      trackingUrl: order.trackingToken
        ? `${STORE_URL}/track/${order.trackingToken}`
        : undefined,
    });
  });
}

/** Get all email templates for admin UI */
export async function getEmailTemplates(): Promise<
  ServerActionResponse<Awaited<ReturnType<typeof prisma.emailTemplate.findMany>>>
> {
  return wrapServerCall(async () => {
    await requireAdmin();
    return prisma.emailTemplate.findMany({ orderBy: { updatedAt: "desc" } });
  });
}

/** Get a single email template */
export async function getEmailTemplate(id: string): Promise<
  ServerActionResponse<Awaited<ReturnType<typeof prisma.emailTemplate.findUnique>>>
> {
  return wrapServerCall(async () => {
    await requireAdmin();
    return prisma.emailTemplate.findUnique({ where: { id } });
  });
}

/** Create a new email template */
export async function createEmailTemplate(data: {
  type: EmailTemplateType;
  name: string;
  subject: string;
  htmlContent: string;
}): Promise<ServerActionResponse<{ id: string }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const template = await prisma.emailTemplate.create({ data });
    return { id: template.id };
  });
}

/** Update an existing email template */
export async function updateEmailTemplate(
  id: string,
  data: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    isActive?: boolean;
  },
): Promise<ServerActionResponse<{ id: string }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
    return { id: template.id };
  });
}

/** Delete an email template */
export async function deleteEmailTemplate(
  id: string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    await prisma.emailTemplate.delete({ where: { id } });
  });
}

/** Get all newsletter subscribers */
export async function getNewsletterSubscribers(): Promise<
  ServerActionResponse<Awaited<ReturnType<typeof prisma.newsletterSubscriber.findMany>>>
> {
  return wrapServerCall(async () => {
    await requireAdmin();
    return prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      take: 10000,
    });
  });
}

/** Subscribe to newsletter (admin only — the public path is the rate-limited
 * `subscribeToNewsletter` in newsletter-actions.ts). */
export async function subscribeToNewsletterDB(
  email: string,
  name?: string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true, name: name ?? undefined },
      create: { email, name: name ?? undefined },
    });
  });
}

/** Unsubscribe from newsletter */
export async function unsubscribeFromNewsletter(
  email: string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    // Public endpoint (email footer links carry no token) — throttle by IP to
    // stop mass/abusive unsubscribes while allowing normal one-off use.
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const rl = await rateLimitUnsubscribe(ip);
    if (!rl.allowed) {
      throw new Error("Too many requests. Please try again shortly.");
    }

    await prisma.newsletterSubscriber
      .update({
        where: { email },
        data: { isActive: false },
      })
      .catch(() => {
        // ignore if not found
      });
  });
}

/** Send a broadcast newsletter to all active subscribers */
export async function sendBroadcastNewsletter(input: {
  emailHeading: string;
  subject: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<ServerActionResponse<{ sent: number; failed: number; total: number }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const { broadcastNewsletter } = await import("@/lib/email/email-service");
    return broadcastNewsletter(input);
  });
}

/** Send a product update to all active subscribers */
export async function sendProductUpdateBroadcast(input: {
  productName: string;
  productDescription: string;
  productPrice: number;
  productImageUrl?: string;
  productUrl: string;
}): Promise<ServerActionResponse<{ sent: number; total: number }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const { broadcastProductUpdate } = await import("@/lib/email/email-service");
    return broadcastProductUpdate(input);
  });
}

/** Send a collection update to all active subscribers */
export async function sendCollectionUpdateBroadcast(input: {
  collectionName: string;
  collectionDescription: string;
  collectionImageUrl?: string;
  collectionUrl: string;
}): Promise<ServerActionResponse<{ sent: number; total: number }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const { broadcastCollectionUpdate } = await import("@/lib/email/email-service");
    return broadcastCollectionUpdate(input);
  });
}

/** Send an arbitrary custom email to the order's customer */
export async function sendCustomEmailToOrderCustomer(
  orderId: string,
  subject: string,
  htmlContent: string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryEmail: true, delieveryName: true },
    });

    if (!order?.deliveryEmail)
      throw new Error("No customer email on this order");

    const { sendCustomEmail } = await import("@/lib/email/email-service");
    await sendCustomEmail({
      to: order.deliveryEmail,
      subject,
      html: htmlContent,
    });
  });
}

export async function previewStatusEmail(
  orderId: string,
  customMessage?: string,
): Promise<ServerActionResponse<{ subject: string; html: string }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        deliveryEmail: true,
        delieveryName: true,
        orderNumber: true,
        status: true,
        trackingToken: true,
      },
    });
    if (!order) throw new Error("Order not found");

    const { renderOrderStatusUpdateEmail } = await import(
      "@/lib/email/email-service"
    );

    return renderOrderStatusUpdateEmail({
      customerName: order.delieveryName ?? "Valued Customer",
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      customMessage,
      orderId,
      trackingUrl: order.trackingToken
        ? `${STORE_URL}/track/${order.trackingToken}`
        : undefined,
    });
  });
}

/**
 * Send test emails of every type to a given address.
 * Used by admin to verify the email system is working.
 */
export async function sendTestEmailsToAddress(
  testEmail: string,
): Promise<ServerActionResponse<{ sent: number; failed: string[] }>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const {
      sendOrderConfirmationEmail,
      sendAdminOrderNotificationEmail,
      sendOrderStatusUpdateEmail,
      sendNewsletterEmail,
    } = await import("@/lib/email/email-service");

    const failed: string[] = [];
    let sent = 0;

    const testDate = new Date().toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const sampleItems = [
      { title: "Bahawalpuri Embroidered Suit", quantity: 1, unitPrice: 3500, image: `${STORE_URL}/assets/about-us-image-1.jpg`, size: "M" },
      { title: "Traditional Khussa", quantity: 2, unitPrice: 1200, image: `${STORE_URL}/assets/about-us-image-2.jpg`, size: "8" },
    ];
    const address = { name: "Ayesha Khan", street: "123 Model Town", city: "Bahawalpur", state: "Punjab", postcode: "63100", country: "Pakistan" };

    // 1. Order Confirmation (Customer)
    try {
      await sendOrderConfirmationEmail({
        to: testEmail,
        customerName: "Ayesha Khan (Test)",
        orderNumber: 9999,
        orderDate: testDate,
        orderStatus: "CONFIRMED",
        items: sampleItems,
        subtotal: 5900,
        shipping: 0,
        total: 5900,
        deliveryAddress: address,
        orderId: "test-order-id",
      });
      sent++;
    } catch (e) {
      failed.push(`Order Confirmation: ${String(e)}`);
    }

    // 2. Admin Order Notification
    try {
      await sendAdminOrderNotificationEmail({
        to: testEmail,
        customerName: "Ayesha Khan (Test)",
        customerEmail: testEmail,
        customerPhone: "+92 300 1234567",
        orderNumber: 9999,
        orderDate: testDate,
        orderStatus: "PENDING",
        items: sampleItems,
        subtotal: 5900,
        shipping: 0,
        total: 5900,
        deliveryAddress: address,
        orderId: "test-order-id",
      });
      sent++;
    } catch (e) {
      failed.push(`Admin Notification: ${String(e)}`);
    }

    // 3. Order Status Update
    try {
      await sendOrderStatusUpdateEmail({
        to: testEmail,
        customerName: "Ayesha Khan (Test)",
        orderNumber: 9999,
        orderStatus: "SHIPPED",
        customMessage: "This is a TEST email from Saaj Tradition admin panel. Your order has been shipped!",
        orderId: "test-order-id",
      });
      sent++;
    } catch (e) {
      failed.push(`Status Update: ${String(e)}`);
    }

    // 4. Newsletter
    try {
      await sendNewsletterEmail({
        to: testEmail,
        subscriberName: "Test Subscriber",
        emailHeading: "Saaj Tradition — Test Newsletter",
        subject: "[TEST] Newsletter from Saaj Tradition",
        body: "<p style=\"font-size:15px;color:#555;line-height:1.8;\">This is a TEST newsletter email sent from the Saaj Tradition admin panel. Your newsletter system is working correctly!</p>",
        imageUrl: undefined,
        ctaText: "Visit Our Store",
        ctaUrl: STORE_URL,
      });
      sent++;
    } catch (e) {
      failed.push(`Newsletter: ${String(e)}`);
    }

    return { sent, failed };
  });
}

// ─── CUSTOMER MANAGEMENT ─────────────────────────────────────────────────────

export type OrderCustomer = {
  email: string;
  name: string;
  orderCount: number;
  lastOrderAt: Date;
};

// Aggregate per email in the database (one row per customer) instead of pulling
// every order into memory and grouping in JS. `DISTINCT ON` keeps the most-recent
// order's name + date, and the window COUNT gives the total. Cached because this
// scans the whole Order table; invalidated on order changes via CACHE_TAG_CART.
const getOrderCustomersCached = unstable_cache(
  async (): Promise<OrderCustomer[]> => {
    const rows = await prisma.$queryRaw<
      Array<{
        email: string;
        name: string | null;
        lastOrderAt: Date;
        orderCount: bigint;
      }>
    >`
      SELECT DISTINCT ON ("deliveryEmail")
        "deliveryEmail" AS email,
        "delieveryName" AS name,
        "createdAt" AS "lastOrderAt",
        COUNT(*) OVER (PARTITION BY "deliveryEmail") AS "orderCount"
      FROM "Order"
      WHERE "deliveryEmail" IS NOT NULL
      ORDER BY "deliveryEmail", "createdAt" DESC
    `;

    return rows
      .map<OrderCustomer>((row) => ({
        email: row.email,
        name: row.name ?? "—",
        orderCount: Number(row.orderCount),
        lastOrderAt: row.lastOrderAt,
      }))
      .sort((a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime());
  },
  [CACHE_TAG_CART, "order-customers"],
  { tags: [CACHE_TAG_CART], revalidate: 300 },
);

/** Get distinct customers from orders (with email), sorted by most recent */
export async function getOrderCustomers(): Promise<
  ServerActionResponse<OrderCustomer[]>
> {
  return wrapServerCall(async () => {
    await requireAdmin();
    return getOrderCustomersCached();
  });
}

/** Send a welcome email to a newsletter subscriber (admin only) */
export async function sendWelcomeEmailAction(
  email: string,
  name?: string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    // Admin-only: the sole caller is the admin customers UI. Without this guard
    // the exposed server action lets anyone drive the store's SMTP to send mail
    // to arbitrary addresses (spam / sender-reputation abuse).
    await requireAdmin();
    const { sendWelcomeEmail } = await import("@/lib/email/email-service");
    await sendWelcomeEmail({ to: email, name });
  });
}

/** Send a thank-you email to a customer who ordered (admin only) */
export async function sendThankYouEmailAction(
  email: string,
  customerName: string,
  orderNumber?: number | string,
): Promise<ServerActionResponse<void>> {
  return wrapServerCall(async () => {
    await requireAdmin();
    const { sendThankYouEmail } = await import("@/lib/email/email-service");
    await sendThankYouEmail({ to: email, customerName, orderNumber });
  });
}
