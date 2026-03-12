type PaymentMethod = "PAYFAST" | "COD";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type CartStatus = "ACTIVE" | "CHECKOUT" | "ABANDONED" | "ORDERED";

type AdminOrderCartItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  title: string;
  image: string;
  size: {
    label: string;
  };
};

export type PaymentEventItem = {
  id: string;
  event: string;
  source: string;
  message: string | null;
  createdAt: Date;
};

// === ORDER WITH CART ===
export type OrderWithCart = {
  id: string;
  orderNumber: number;
  cartId: string;
  createdAt: Date;
  updatedAt: Date;
  delieveryName: string | null;
  deliveryEmail: string | null;
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
  paymentSessionId: string | null;
  totalPrice: number;
  shippingAmount: number | null;
  couponCode: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  orderNote: string | null;
  trackingToken: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  cart: {
    id: string;
    userId: string | null;
    status: CartStatus;
    createdAt: Date;
    updatedAt: Date;
    reservedAt: Date | null;
    checkoutAt: Date | null;
    abandonedAt: Date | null;
    items: Array<{
      id: string;
      cartId: string;
      productId: string;
      sizeId: string;
      quantity: number;
      unitPrice: number;
      title: string;
      image: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
};

export type GetAdminOrder = {
  id: string;
  orderNumber: number;
  createdAt: Date;
  updatedAt: Date;
  delieveryName: string | null;
  deliveryEmail: string | null;
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
  paymentSessionId: string | null;
  totalPrice: number;
  shippingAmount: number | null;
  couponCode: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  orderNote: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  cart: {
    items: AdminOrderCartItem[];
  };
  paymentEvents: PaymentEventItem[];
};

export type DashboardRecentOrder = {
  id: string;
  orderNumber: number;
  delieveryName: string | null;
  deliveryEmail: string | null;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Date;
};

export type OrderDashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  statusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  failedPayments: number;
  pendingPayments: number;
  recentOrders: DashboardRecentOrder[];
};

// === ADMIN PAYMENTS PAGE ===

export type PaymentRecord = {
  id: string;
  orderNumber: number;
  createdAt: Date;
  updatedAt: Date;
  totalPrice: number;
  shippingAmount: number | null;
  discountAmount: number | null;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  delieveryName: string | null;
  deliveryEmail: string | null;
  deliveryPhone: string | null;
  deliveryCity: string | null;
  itemsCount: number;
};

export type PaymentSummary = {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  codRevenue: number;
  onlineRevenue: number;
  codOrders: number;
  onlineOrders: number;
  avgOrderValue: number;
  // Monthly data for current month
  monthlyRevenue: number;
  monthlyOrders: number;
};
