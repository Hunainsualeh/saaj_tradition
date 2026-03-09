"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-800",
  PAID:       "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED:    "bg-purple-100 text-purple-800",
  DELIVERED:  "bg-green-100 text-green-800",
  CANCELLED:  "bg-red-100 text-red-800",
  REFUNDED:   "bg-gray-100 text-gray-700",
};

import {
  AdminBaseTable,
  AdminButton,
  AdminDropdownMenu,
  AdminDropdownMenuTrigger,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuLabel,
  AdminDropdownMenuCheckboxItem,
  AdminInput,
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/components/admin";
import { useRouter } from "next/navigation";
import { adminRoutes, formatDateToYYYYMMDD } from "@/lib";
import { orderColumns, defaultVisibleOrderColumnIds } from "./columns";
import { OrderWithCart } from "@/types/client";
import { updateOrderStatus } from "@/lib/server/actions/order-actions";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type AdminOrdersTableProps = {
  orders: OrderWithCart[];
};

export function AdminOrdersTable(props: AdminOrdersTableProps) {
  // === PROPS ===
  const { orders } = props;

  // === HOOKS ===
  const router = useRouter();

  // === STATE ===
  const [searchTerm, setSearchTerm] = useState("");
  const [ordersState, setOrdersState] = useState(orders);
  const [columnsVisible, setColumnsVisible] = useState<Set<string>>(
    defaultVisibleOrderColumnIds,
  );

  // === FUNCTIONS ===
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setOrdersState((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: result.data.status as OrderWithCart["status"] } : o,
        ),
      );
      toast.success(`Order status updated to ${newStatus}`);
      router.refresh();
    } else {
      toast.error("Failed to update order status");
    }
  };

  const formatOrders = (orders: OrderWithCart[]) => {
    return orders.map((order) => {
      const itemsCount = order.cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      return {
        ...order,
        itemsCount,
        totalPrice: `Rs.${order.totalPrice.toFixed(2)}`,
        paymentMethod:
          order.paymentMethod === "COD"
            ? "Cash on Delivery"
            : "PayFast",
        createdAt: formatDateToYYYYMMDD(order.createdAt) ?? "",
        updatedAt: formatDateToYYYYMMDD(order.updatedAt) ?? "",
      };
    });
  };

  // === MEMO ===
  const searchLower = searchTerm.toLowerCase();
  const filteredOrders = formatOrders(
    ordersState.filter((order) => {
      if (!searchTerm) return true;
      const productTitles = order.cart.items.map((i) => i.title.toLowerCase()).join(" ");
      return (
        order.orderNumber.toString().includes(searchTerm) ||
        order.deliveryEmail?.toLowerCase().includes(searchLower) ||
        order.delieveryName?.toLowerCase().includes(searchLower) ||
        order.deliveryPhone?.toLowerCase().includes(searchLower) ||
        order.deliveryCity?.toLowerCase().includes(searchLower) ||
        order.couponCode?.toLowerCase().includes(searchLower) ||
        order.trackingToken?.toLowerCase().includes(searchLower) ||
        order.status.toLowerCase().includes(searchLower) ||
        order.paymentStatus.toLowerCase().includes(searchLower) ||
        productTitles.includes(searchLower)
      );
    }),
  );

  return (
    <>
      <div className="flex justify-between items-center">
        <AdminInput
          type="text"
          placeholder="Search by order #, name, email, phone, city, tracking ID, product, status…"
          className="my-3 max-w-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex justify-end">
          {/* === COLUMN TOGGLER === */}
          <AdminDropdownMenu>
            <AdminDropdownMenuTrigger asChild>
              <AdminButton variant="outline">Columns</AdminButton>
            </AdminDropdownMenuTrigger>
            <AdminDropdownMenuContent>
              <AdminDropdownMenuLabel>Show/Hide Columns</AdminDropdownMenuLabel>
              {orderColumns.map((column) => (
                <AdminDropdownMenuCheckboxItem
                  key={column.accessorKey}
                  checked={columnsVisible.has(column.accessorKey)}
                  onCheckedChange={(checked) =>
                    setColumnsVisible((prev) => {
                      const newSet = new Set(prev);
                      if (checked) {
                        newSet.add(column.accessorKey);
                      } else {
                        newSet.delete(column.accessorKey);
                      }
                      return newSet;
                    })
                  }
                >
                  {column.header}
                </AdminDropdownMenuCheckboxItem>
              ))}
            </AdminDropdownMenuContent>
          </AdminDropdownMenu>
        </div>
      </div>
      <AdminBaseTable
        data={filteredOrders}
        onRowClick={(row) => router.push(`${adminRoutes.orders}/${row.id}`)}
        columns={[
          ...orderColumns.filter((column) =>
            columnsVisible.has(column.accessorKey),
          ),
          {
            id: "actions",
            enableHiding: false,
            cell: (cell) => {
              const order = cell.row.original;

              return (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Status badge + change dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-700"}`}>
                      {order.status}
                    </span>
                    <AdminSelect
                      value={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <AdminSelectTrigger className="w-7 h-7 p-0 border-none shadow-none bg-transparent [&>svg]:mx-auto [&>span]:hidden">
                        <AdminSelectValue />
                      </AdminSelectTrigger>
                      <AdminSelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <AdminSelectItem key={s} value={s}>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[s] ?? ""}`}>
                              {s}
                            </span>
                          </AdminSelectItem>
                        ))}
                      </AdminSelectContent>
                    </AdminSelect>
                  </div>

                  {/* Actions Menu */}
                  <AdminDropdownMenu>
                    <AdminDropdownMenuTrigger asChild>
                      <AdminButton variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                      </AdminButton>
                    </AdminDropdownMenuTrigger>

                    <AdminDropdownMenuContent
                      className="cursor-pointer"
                      align="end"
                    >
                      <Link href={`${adminRoutes.orders}/${order.id}`}>
                        <AdminDropdownMenuItem>
                          View Details
                        </AdminDropdownMenuItem>
                      </Link>
                    </AdminDropdownMenuContent>
                  </AdminDropdownMenu>
                </div>
              );
            },
          },
        ]}
      />
    </>
  );
}
