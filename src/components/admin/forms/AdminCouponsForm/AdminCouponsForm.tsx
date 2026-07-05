"use client";

import { useState } from "react";
import type { Coupon } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  AdminButton,
  AdminField,
  AdminFieldDescription,
  AdminFieldError,
  AdminFieldGroup,
  AdminFieldLabel,
  AdminFieldSet,
  AdminInput,
} from "@/components/admin";
import { AdminCouponFormData, AdminCouponFormSchema } from "./schema";
import {
  createCoupon,
  deleteCouponById,
  updateCouponById,
} from "@/lib/server/actions";

type AdminCouponsFormProps = {
  isEditMode?: boolean;
  couponData?: Coupon;
};

export function AdminCouponsForm(props: AdminCouponsFormProps) {
  const { isEditMode = false, couponData } = props;
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionLocked, setIsActionLocked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminCouponFormData>({
    resolver: zodResolver(AdminCouponFormSchema),
    defaultValues: {
      code: couponData?.code ?? "",
      discountPercent: couponData?.discountPercent ?? 10,
      maxUses: couponData?.maxUses ?? 0,
      isActive: couponData?.isActive ?? true,
      expiresAt: couponData?.expiresAt
        ? new Date(couponData.expiresAt).toISOString().split("T")[0]
        : "",
    },
  });

  const onSubmit = async (data: AdminCouponFormData) => {
    setIsActionLocked(true);
    const res = isEditMode
      ? await updateCouponById(couponData?.id || "", data)
      : await createCoupon(data);

    if (!res.success) {
      setIsActionLocked(false);
      toast.error(
        isEditMode ? "Error updating coupon" : "Error creating coupon",
      );
      return;
    }
    toast.success(
      isEditMode
        ? "Coupon updated successfully!"
        : "Coupon created successfully!",
    );
    router.back();
  };

  const onDelete = async () => {
    if (!couponData?.id) return;
    setIsDeleting(true);
    setIsActionLocked(true);
    const res = await deleteCouponById(couponData?.id);
    if (!res.success) {
      setIsDeleting(false);
      setIsActionLocked(false);
      toast.error("Error deleting coupon");
      return;
    }
    toast.success("Coupon deleted successfully!");
    router.back();
  };

  const isBusy = isActionLocked || isDeleting;

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="pt-3">
        <AdminFieldGroup>
          <AdminFieldSet>
            <AdminFieldDescription>
              {isEditMode
                ? "Edit the coupon details below."
                : "Create a new discount coupon."}
            </AdminFieldDescription>
            <AdminFieldGroup>
              <AdminField>
                <AdminFieldLabel htmlFor="code">Coupon Code</AdminFieldLabel>
                <AdminInput
                  id="code"
                  {...register("code")}
                  placeholder="e.g. SAVE20"
                  className="uppercase"
                />
                <AdminFieldError errors={[errors.code]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="discountPercent">
                  Discount Percentage
                </AdminFieldLabel>
                <AdminInput
                  id="discountPercent"
                  type="number"
                  min={1}
                  max={100}
                  {...register("discountPercent", { valueAsNumber: true })}
                />
                <AdminFieldError errors={[errors.discountPercent]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="maxUses">
                  Max Uses (0 = unlimited)
                </AdminFieldLabel>
                <AdminInput
                  id="maxUses"
                  type="number"
                  min={0}
                  {...register("maxUses", { valueAsNumber: true })}
                />
                <AdminFieldError errors={[errors.maxUses]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="expiresAt">
                  Expiry Date (optional)
                </AdminFieldLabel>
                <AdminInput
                  id="expiresAt"
                  type="date"
                  {...register("expiresAt")}
                />
                <AdminFieldError errors={[errors.expiresAt]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="isActive">Active</AdminFieldLabel>
                <input
                  id="isActive"
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4"
                />
              </AdminField>
              {isEditMode && couponData && (
                <div className="text-sm text-neutral-09">
                  Used {couponData.currentUses}
                  {couponData.maxUses ? ` / ${couponData.maxUses}` : ""} times
                </div>
              )}
            </AdminFieldGroup>
            <div className="flex flex-col gap-3">
              <AdminButton className="flex-1" type="submit" disabled={isBusy}>
                {isActionLocked && !isDeleting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Coupon"}
              </AdminButton>
              {isEditMode && (
                <AdminButton
                  type="button"
                  onClick={onDelete}
                  disabled={isBusy}
                  variant="outline"
                  className="flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete Coupon"}
                </AdminButton>
              )}
            </div>
          </AdminFieldSet>
        </AdminFieldGroup>
      </form>
    </div>
  );
}
