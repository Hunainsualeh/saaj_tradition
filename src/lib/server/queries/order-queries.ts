import { unstable_cache } from "next/cache";

import { Order, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import {
  OrderDashboardStats,
  GetAdminOrder,
  OrderWithCart,
  DashboardRecentOrder,
} from "@/types/client";
import { wrapServerCall } from "../helpers";
import { CACHE_TAG_CART } from "@/lib/constants/cache-tags";

export async function getCurrentOrderById(
  orderId: string,
): Promise<ServerActionResponse<Order | null>> {
  return wrapServerCall(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    return order;
  });
}

export type OrderSuccessData = {
  id: string;
  orderNumber: number;
  createdAt: Date;
  deliveryEmail: string | null;
  delieveryName: string | null;
  deliveryPhone: string | null;
  deliveryStreetAddress: string | null;
  deliveryCity: string | null;
  deliveryPostcode: string | null;
  deliveryState: string | null;
  deliveryCountry: string | null;
  billingName: string | null;
  billingStreetAddress: string | null;
  billingCity: string | null;
  billingPostcode: string | null;
  billingState: string | null;
  billingCountry: string | null;
  totalPrice: number;
  shippingAmount: number | null;
  couponCode: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  paymentMethod: string;
  trackingToken: string | null;
  items: {
    id: string;
    title: string;
    image: string;
    quantity: number;
    unitPrice: number;
    size: { label: string };
  }[];
};

export async function getOrderForSuccessPage(
  orderId: string,
): Promise<ServerActionResponse<OrderSuccessData | null>> {
  return wrapServerCall(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            title: true,
            image: true,
            sizeLabel: true,
          },
        },
        // Legacy fallback: old orders without orderItems still show items via cart
        cart: {
          include: {
            items: {
              select: {
                id: true,
                quantity: true,
                unitPrice: true,
                title: true,
                image: true,
                size: { select: { label: true } },
              },
            },
          },
        },
      },
    });

    if (!order) return null;

    // Prefer orderItems snapshot; fall back to live cart items for old orders
    const rawItems =
      order.orderItems.length > 0
        ? order.orderItems.map((i) => ({ ...i, size: { label: i.sizeLabel } }))
        : order.cart.items.map((i) => ({ ...i, size: { label: i.size.label } }));

    return {
      id: order.id,
      orderNumber: order.orderNumber!,
      createdAt: order.createdAt,
      deliveryEmail: order.deliveryEmail,
      delieveryName: order.delieveryName,
      deliveryPhone: order.deliveryPhone,
      deliveryStreetAddress: order.deliveryStreetAddress,
      deliveryCity: order.deliveryCity,
      deliveryPostcode: order.deliveryPostcode,
      deliveryState: order.deliveryState,
      deliveryCountry: order.deliveryCountry,
      billingName: order.billingName,
      billingStreetAddress: order.billingStreetAddress,
      billingCity: order.billingCity,
      billingPostcode: order.billingPostcode,
      billingState: order.billingState,
      billingCountry: order.billingCountry,
      totalPrice: Number(order.totalPrice),
      shippingAmount: order.shippingAmount ? Number(order.shippingAmount) : null,
      couponCode: order.couponCode,
      discountPercent: order.discountPercent,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
      paymentMethod: order.paymentMethod,
      trackingToken: order.trackingToken,
      items: rawItems.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
      })),
    };
  });
}

export async function getAdminOrderById(
  orderId: string,
): Promise<ServerActionResponse<GetAdminOrder | null>> {
  return wrapServerCall(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            title: true,
            image: true,
            sizeLabel: true,
          },
        },
        // Legacy fallback for orders created before OrderItem was added
        cart: {
          include: {
            items: {
              select: {
                id: true,
                quantity: true,
                unitPrice: true,
                title: true,
                image: true,
                size: {
                  select: {
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    const rawItems =
      order.orderItems.length > 0
        ? order.orderItems.map((i) => ({ ...i, size: { label: i.sizeLabel } }))
        : order.cart.items.map((i) => ({ ...i, size: { label: i.size.label } }));

    return {
      ...order,
      totalPrice: Number(order.totalPrice),
      shippingAmount: order.shippingAmount ? Number(order.shippingAmount) : null,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
      cart: {
        ...order.cart,
        items: rawItems.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
        })),
      },
    };
  });
}

const getOrderedOrdersCached = unstable_cache(
  async () => {
    const orders = await prisma.order.findMany({
      include: {
        cart: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => ({
      ...order,
      totalPrice: Number(order.totalPrice),
      shippingAmount: order.shippingAmount ? Number(order.shippingAmount) : null,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
      cart: {
        ...order.cart,
        items: order.cart.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
        })),
      },
    }));
  },
  [CACHE_TAG_CART, "ordered-orders"],
  { tags: [CACHE_TAG_CART], revalidate: 60 },
);

export async function getOrderedOrders(): Promise<
  ServerActionResponse<OrderWithCart[]>
> {
  return wrapServerCall(() => getOrderedOrdersCached());
}

export async function getDashboardStats(): Promise<
  ServerActionResponse<OrderDashboardStats>
> {
  return wrapServerCall(async () => {
    const REVENUE_STATUSES = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const [totalOrdersCount, pendingCount, revenueData, statusGroups, recentRaw] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        prisma.order.aggregate({
          where: { status: { in: REVENUE_STATUSES } },
          _sum: { totalPrice: true },
        }),
        prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.order.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            delieveryName: true,
            deliveryEmail: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    const totalRevenue = Number(revenueData._sum.totalPrice ?? 0);
    const paidCount =
      (statusGroups.find((g) => g.status === OrderStatus.PAID)?._count._all ?? 0) +
      (statusGroups.find((g) => g.status === OrderStatus.PROCESSING)?._count._all ?? 0) +
      (statusGroups.find((g) => g.status === OrderStatus.SHIPPED)?._count._all ?? 0) +
      (statusGroups.find((g) => g.status === OrderStatus.DELIVERED)?._count._all ?? 0);
    const averageOrderValue = paidCount > 0 ? totalRevenue / paidCount : 0;

    const statusBreakdown: Record<string, number> = {};
    statusGroups.forEach((g) => {
      statusBreakdown[g.status] = g._count._all;
    });

    const recentOrders: DashboardRecentOrder[] = recentRaw.map((o) => ({
      ...o,
      totalPrice: Number(o.totalPrice),
    }));

    return {
      totalRevenue,
      totalOrders: totalOrdersCount,
      pendingOrders: pendingCount,
      averageOrderValue,
      statusBreakdown,
      recentOrders,
    };
  });
}
