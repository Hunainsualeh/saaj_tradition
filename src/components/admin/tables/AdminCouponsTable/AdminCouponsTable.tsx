"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  AdminBaseTable,
  AdminButton,
  AdminDropdownMenu,
  AdminDropdownMenuTrigger,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuSeparator,
  AdminAlertDialog,
  AdminAlertDialogContent,
  AdminAlertDialogTitle,
  AdminAlertDialogDescription,
  AdminAlertDialogCancel,
  AdminAlertDialogAction,
  AdminAlertDialogHeader,
  AdminAlertDialogFooter,
  AdminInput,
} from "@/components/admin";
import { useRouter } from "next/navigation";
import { deleteCouponById } from "@/lib/server/actions";
import { CouponItem } from "@/types/client";
import { adminRoutes } from "@/lib";
import { couponColumns } from "./columns";

export function AdminCouponsTable({
  coupons,
}: {
  coupons: CouponItem[];
}) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [couponsState, setCouponsState] = useState(coupons);
  const [searchTerm, setSearchTerm] = useState("");

  const deleteCoupon = async (id: string) => {
    const deleted = await deleteCouponById(id);
    setDeletingId(null);
    if (!deleted.success) {
      toast.error("Failed to delete coupon.");
      return;
    }
    setPendingDeleteId(null);
    setCouponsState((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coupon deleted successfully.");
  };

  const filteredCoupons = couponsState.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <AdminInput
        type="text"
        placeholder="Search coupons"
        className="my-3 max-w-lg"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <AdminBaseTable
        data={filteredCoupons}
        onRowClick={(row) => router.push(`${adminRoutes.coupons}/${row.id}`)}
        columns={[
          ...couponColumns,
          {
            id: "actions",
            enableHiding: false,
            cell: (cell) => {
              const coupon = cell.row.original;
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <AdminDropdownMenu>
                    <AdminDropdownMenuTrigger asChild>
                      <AdminButton variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                      </AdminButton>
                    </AdminDropdownMenuTrigger>
                    <AdminDropdownMenuContent align="end">
                      <Link href={`${adminRoutes.coupons}/${coupon.id}`}>
                        <AdminDropdownMenuItem>Edit</AdminDropdownMenuItem>
                      </Link>
                      <AdminDropdownMenuSeparator />
                      <AdminDropdownMenuItem
                        variant="destructive"
                        onSelect={() => setPendingDeleteId(coupon.id)}
                      >
                        Delete
                      </AdminDropdownMenuItem>
                    </AdminDropdownMenuContent>
                  </AdminDropdownMenu>
                </div>
              );
            },
          },
        ]}
      />

      <AdminAlertDialog
        open={!!pendingDeleteId}
        onOpenChange={() => setPendingDeleteId(null)}
      >
        <AdminAlertDialogContent>
          <AdminAlertDialogHeader>
            <AdminAlertDialogTitle>Delete this coupon?</AdminAlertDialogTitle>
            <AdminAlertDialogDescription>
              This action cannot be undone.
            </AdminAlertDialogDescription>
          </AdminAlertDialogHeader>
          <AdminAlertDialogFooter>
            <AdminAlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AdminAlertDialogCancel>
            <AdminAlertDialogAction
              disabled={!!deletingId}
              onClick={() => {
                setDeletingId(pendingDeleteId);
                if (pendingDeleteId) {
                  deleteCoupon(pendingDeleteId);
                }
              }}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AdminAlertDialogAction>
          </AdminAlertDialogFooter>
        </AdminAlertDialogContent>
      </AdminAlertDialog>
    </>
  );
}
