"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AdminButton,
  AdminField,
  AdminFieldLabel,
  AdminInput,
} from "@/components/admin";
import {
  updateGlobalShippingRate,
  bulkUpdateProductShippingCharges,
  type ProductShippingItem,
} from "@/lib/server/actions/shipping-actions";

type AdminShippingFormProps = {
  globalRate: number;
  products: ProductShippingItem[];
};

export function AdminShippingForm({
  globalRate,
  products,
}: AdminShippingFormProps) {
  const [globalInput, setGlobalInput] = useState(
    globalRate > 0 ? globalRate.toFixed(2) : "0.00",
  );
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  // Map: productId → override value as string ("" = cleared = null)
  const [overrides, setOverrides] = useState<Record<string, string>>(
    products.reduce(
      (acc, p) => {
        acc[p.id] =
          p.shippingCharge !== null ? p.shippingCharge.toFixed(2) : "";
        return acc;
      },
      {} as Record<string, string>,
    ),
  );
  const [isSavingProducts, setIsSavingProducts] = useState(false);

  const handleSaveGlobal = async () => {
    const amount = parseFloat(globalInput);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount (0 for free shipping).");
      return;
    }
    setIsSavingGlobal(true);
    const res = await updateGlobalShippingRate(amount);
    if (!res.success) {
      toast.error("Failed to update global shipping rate.");
    } else {
      toast.success("Global shipping rate updated!");
    }
    setIsSavingGlobal(false);
  };

  const handleSaveProducts = async () => {
    // Build updates only for entries that have a valid value or explicit clear
    const updates = products.map((p) => {
      const raw = overrides[p.id]?.trim();
      if (!raw || raw === "") {
        return { id: p.id, shippingCharge: null };
      }
      const val = parseFloat(raw);
      return {
        id: p.id,
        shippingCharge: isNaN(val) || val < 0 ? null : val,
      };
    });

    setIsSavingProducts(true);
    const res = await bulkUpdateProductShippingCharges(updates);
    if (!res.success) {
      toast.error("Failed to save product shipping overrides.");
    } else {
      toast.success("Product shipping overrides saved!");
    }
    setIsSavingProducts(false);
  };

  return (
    <div className="space-y-10 max-w-3xl">
      {/* ── Global Rate ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Global Shipping Rate
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Default shipping charge applied to all orders. Set to{" "}
          <strong>0</strong> for free shipping.
        </p>
        <div className="flex items-end gap-3 max-w-xs">
          <AdminField className="flex-1">
            <AdminFieldLabel htmlFor="globalRate">
              Amount (Rs.)
            </AdminFieldLabel>
            <AdminInput
              id="globalRate"
              type="number"
              min="0"
              step="0.01"
              value={globalInput}
              onChange={(e) => setGlobalInput(e.target.value)}
              placeholder="0.00"
            />
          </AdminField>
          <AdminButton
            type="button"
            onClick={handleSaveGlobal}
            disabled={isSavingGlobal}
            className="mb-0.5"
          >
            {isSavingGlobal ? "Saving..." : "Save"}
          </AdminButton>
        </div>
      </div>

      {/* ── Per-Product Overrides ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Per-Product Shipping Overrides
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Set a custom shipping charge for specific products. Leave blank to
          use the global rate. Products with an override will use the highest
          applicable rate at checkout.
        </p>

        {products.length === 0 ? (
          <p className="text-sm text-gray-400">No products found.</p>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-3 px-2 mb-2">
              <span className="col-span-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Product
              </span>
              <span className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
                Price
              </span>
              <span className="col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Shipping Override (Rs.)
              </span>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-12 gap-3 items-center px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-6">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400">{product.slug}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-gray-600">
                      Rs.{product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <AdminInput
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Global (Rs.${globalRate.toFixed(2)})`}
                      value={overrides[product.id] ?? ""}
                      onChange={(e) =>
                        setOverrides((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <AdminButton
                type="button"
                onClick={handleSaveProducts}
                disabled={isSavingProducts}
              >
                {isSavingProducts ? "Saving..." : "Save All Overrides"}
              </AdminButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
