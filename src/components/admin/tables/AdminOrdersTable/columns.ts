export const orderColumns = [
  { accessorKey: "orderNumber", header: "Order #" },
  { accessorKey: "deliveryEmail", header: "Email" },
  { accessorKey: "delieveryName", header: "Name" },
  { accessorKey: "deliveryPhone", header: "Phone" },
  { accessorKey: "deliveryCity", header: "City" },
  { accessorKey: "itemsCount", header: "Items" },
  { accessorKey: "totalPrice", header: "Total" },
  { accessorKey: "paymentStatus", header: "Payment" },
  { accessorKey: "paymentMethod", header: "Payment Method" },
  { accessorKey: "couponCode", header: "Coupon" },
  { accessorKey: "trackingToken", header: "Tracking ID" },
  { accessorKey: "createdAt", header: "Date" },
  { accessorKey: "updatedAt", header: "Updated" },
];

export const defaultVisibleOrderColumnIds = new Set([
  "orderNumber",
  "deliveryEmail",
  "delieveryName",
  "itemsCount",
  "totalPrice",
  "createdAt",
]);
