import { unstable_cache } from "next/cache";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { PaymentRecord, PaymentSummary } from "@/types/client";
import { wrapServerCall } from "../helpers";
import { CACHE_TAG_CART } from "@/lib/constants/cache-tags";

const PAYMENT_RECORDS_LIMIT = 500;

const REVENUE_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const getPaymentSummaryCached = unstable_cache(
  async (): Promise<PaymentSummary> => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTransactions,
      paymentStatusGroups,
      revenueData,
      codRevenueData,
      onlineRevenueData,
      codCount,
      onlineCount,
      monthlyRevenueData,
      monthlyOrdersCount,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({ by: ["paymentStatus"], _count: { _all: true } }),
      prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES } },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES }, paymentMethod: PaymentMethod.COD },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES }, paymentMethod: PaymentMethod.PAYFAST },
        _sum: { totalPrice: true },
      }),
      prisma.order.count({ where: { paymentMethod: PaymentMethod.COD } }),
      prisma.order.count({ where: { paymentMethod: PaymentMethod.PAYFAST } }),
      prisma.order.aggregate({
        where: {
          status: { in: REVENUE_STATUSES },
          createdAt: { gte: monthStart },
        },
        _sum: { totalPrice: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: monthStart } },
      }),
    ]);

    const totalRevenue = Number(revenueData._sum.totalPrice ?? 0);
    const successful =
      paymentStatusGroups.find((g) => g.paymentStatus === PaymentStatus.PAID)?._count._all ?? 0;
    const failed =
      paymentStatusGroups.find((g) => g.paymentStatus === PaymentStatus.FAILED)?._count._all ?? 0;
    const pending =
      paymentStatusGroups.find((g) => g.paymentStatus === PaymentStatus.PENDING)?._count._all ?? 0;
    const refunded =
      paymentStatusGroups.find((g) => g.paymentStatus === PaymentStatus.REFUNDED)?._count._all ?? 0;

    return {
      totalRevenue,
      totalTransactions,
      successfulPayments: successful,
      failedPayments: failed,
      pendingPayments: pending,
      refundedPayments: refunded,
      codRevenue: Number(codRevenueData._sum.totalPrice ?? 0),
      onlineRevenue: Number(onlineRevenueData._sum.totalPrice ?? 0),
      codOrders: codCount,
      onlineOrders: onlineCount,
      avgOrderValue: successful > 0 ? totalRevenue / successful : 0,
      monthlyRevenue: Number(monthlyRevenueData._sum.totalPrice ?? 0),
      monthlyOrders: monthlyOrdersCount,
    };
  },
  [CACHE_TAG_CART, "payment-summary"],
  { tags: [CACHE_TAG_CART], revalidate: 120 },
);

export async function getPaymentSummary(): Promise<
  ServerActionResponse<PaymentSummary>
> {
  return wrapServerCall(() => getPaymentSummaryCached());
}

export async function getPaymentRecords(filters?: {
  paymentStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<ServerActionResponse<PaymentRecord[]>> {
  return wrapServerCall(async () => {
    // Build where clause from filters
    const where: Record<string, unknown> = {};

    if (filters?.paymentStatus && filters.paymentStatus !== "ALL") {
      where.paymentStatus = filters.paymentStatus as PaymentStatus;
    }
    if (filters?.paymentMethod && filters.paymentMethod !== "ALL") {
      where.paymentMethod = filters.paymentMethod as PaymentMethod;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (filters.dateFrom) createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        createdAt.lte = endDate;
      }
      where.createdAt = createdAt;
    }
    if (filters?.search) {
      const s = filters.search;
      const orderNum = parseInt(s, 10);
      where.OR = [
        { delieveryName: { contains: s, mode: "insensitive" } },
        { deliveryEmail: { contains: s, mode: "insensitive" } },
        { deliveryPhone: { contains: s, mode: "insensitive" } },
        { deliveryCity: { contains: s, mode: "insensitive" } },
        ...(Number.isFinite(orderNum) ? [{ orderNumber: orderNum }] : []),
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      take: PAYMENT_RECORDS_LIMIT,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        updatedAt: true,
        totalPrice: true,
        shippingAmount: true,
        discountAmount: true,
        couponCode: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        delieveryName: true,
        deliveryEmail: true,
        deliveryPhone: true,
        deliveryCity: true,
        orderItems: { select: { quantity: true } },
        cart: { select: { items: { select: { quantity: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => {
      const itemsCount =
        o.orderItems.length > 0
          ? o.orderItems.reduce((s, i) => s + i.quantity, 0)
          : o.cart.items.reduce((s, i) => s + i.quantity, 0);

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        totalPrice: Number(o.totalPrice),
        shippingAmount: o.shippingAmount ? Number(o.shippingAmount) : null,
        discountAmount: o.discountAmount ? Number(o.discountAmount) : null,
        couponCode: o.couponCode,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        status: o.status,
        delieveryName: o.delieveryName,
        deliveryEmail: o.deliveryEmail,
        deliveryPhone: o.deliveryPhone,
        deliveryCity: o.deliveryCity,
        itemsCount,
      };
    });
  });
}
