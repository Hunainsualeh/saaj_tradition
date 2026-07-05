"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { bulkUpdateSiteContent } from "@/lib/server/actions";
import { SiteContentItem } from "@/types/client";
import {
  AdminButton,
  AdminField,
  AdminFieldGroup,
  AdminFieldLabel,
  AdminFieldSet,
  AdminInput,
  AdminTagListField,
  PartnerLogosField,
} from "@/components/admin";

type BasicProduct = { id: string; name: string; images: string[] };

type AdminMarqueeFormProps = {
  items: SiteContentItem[];
  allProducts: BasicProduct[];
};

function Toggle({
  isOn,
  onToggle,
  id,
}: {
  isOn: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={isOn}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 shrink-0 ${
        isOn ? "bg-neutral-900" : "bg-neutral-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          isOn ? "translate-x-8" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ProductPicker({
  allProducts,
  selectedIds,
  onChange,
}: {
  allProducts: BasicProduct[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedProducts = allProducts.filter((p) =>
    selectedIds.includes(p.id),
  );

  return (
    <div className="flex flex-col gap-3">
      {selectedIds.length > 0 && (
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2">
            Selected ({selectedIds.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 bg-neutral-900 text-white text-xs px-2.5 py-1 rounded-full"
              >
                {p.images[0] && (
                  <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      sizes="16px"
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="max-w-[120px] truncate">{p.name}</span>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="ml-0.5 opacity-70 hover:opacity-100 font-bold leading-none"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedIds.length === 0 && (
        <p className="text-xs text-neutral-400 italic">
          No products selected - marquee will show the latest 12 active products automatically.
        </p>
      )}

      <AdminInput
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="border border-neutral-200 rounded-md overflow-y-auto max-h-64">
        {filtered.length === 0 && (
          <p className="text-xs text-neutral-400 p-3">No products found.</p>
        )}
        {filtered.map((p) => {
          const checked = selectedIds.includes(p.id);
          return (
            <label
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 ${
                checked ? "bg-neutral-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p.id)}
                className="accent-neutral-900 h-4 w-4 shrink-0"
              />
              {p.images[0] ? (
                <div className="relative w-8 h-10 shrink-0 overflow-hidden rounded bg-neutral-200">
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-10 shrink-0 rounded bg-neutral-200" />
              )}
              <span className="text-sm text-neutral-800 flex-1 min-w-0 truncate">
                {p.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  activeKey,
  isOn,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  activeKey: string;
  isOn: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 bg-neutral-50 border-b border-neutral-200">
        <div>
          <h3 className="font-semibold text-sm text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-medium text-neutral-500 select-none">
            {isOn ? "Active" : "Inactive"}
          </span>
          <Toggle id={activeKey} isOn={isOn} onToggle={onToggle} />
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function AdminMarqueeForm({ items, allProducts }: AdminMarqueeFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    items.reduce(
      (acc, item) => { acc[item.id] = item.value; return acc; },
      {} as Record<string, string>,
    ),
  );
  const [isSaving, setIsSaving] = useState(false);

  const byKey = items.reduce(
    (acc, item) => { acc[item.key] = item; return acc; },
    {} as Record<string, SiteContentItem>,
  );

  const set = (id: string, v: string) =>
    setValues((p) => ({ ...p, [id]: v }));

  const toggle = (key: string) => {
    const item = byKey[key];
    if (!item) return;
    set(item.id, values[item.id] === "true" ? "false" : "true");
  };

  const val = (key: string) => {
    const item = byKey[key];
    return item ? (values[item.id] ?? item.value) : "";
  };

  const isOn = (key: string) => val(key) === "true";

  const productIdsItem = byKey["marquee_product_ids"];
  const selectedProductIds = productIdsItem
    ? (values[productIdsItem.id] ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const setProductIds = (ids: string[]) => {
    if (!productIdsItem) return;
    set(productIdsItem.id, ids.join(","));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updates = items
      .filter((item) => values[item.id] !== item.value)
      .map((item) => ({ id: item.id, value: values[item.id] }));

    if (updates.length === 0) {
      toast.info("No changes to save.");
      setIsSaving(false);
      return;
    }

    const res = await bulkUpdateSiteContent(updates);
    if (!res.success) {
      toast.error("Error saving changes.");
      setIsSaving(false);
      return;
    }
    toast.success(`${updates.length} change(s) saved!`);
    setIsSaving(false);
  };

  const renderField = (item: SiteContentItem) => {
    const isColor = item.key.endsWith("_color");
    const isPartnerLogos = item.key === "partners_logos";
    const isMultiLine = item.key.endsWith("_texts");
    const currentVal = values[item.id] ?? "";

    return (
      <AdminField key={item.id}>
        <AdminFieldLabel htmlFor={item.key}>{item.label}</AdminFieldLabel>
        {isColor ? (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={currentVal || "#000000"}
              onChange={(e) => set(item.id, e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-neutral-200 p-0.5 bg-white"
            />
            <AdminInput
              id={item.key}
              value={currentVal}
              onChange={(e) => set(item.id, e.target.value)}
              className="flex-1 font-mono"
              placeholder="#000000"
            />
          </div>
        ) : isPartnerLogos ? (
          <PartnerLogosField
            value={currentVal}
            onChange={(v) => set(item.id, v)}
          />
        ) : isMultiLine ? (
          <AdminTagListField
            id={item.key}
            value={currentVal}
            onChange={(v) => set(item.id, v)}
            placeholder="Type an announcement line and press Enter..."
          />
        ) : (
          <AdminInput
            id={item.key}
            value={currentVal}
            onChange={(e) => set(item.id, e.target.value)}
          />
        )}
      </AdminField>
    );
  };

  const announcementItems = items.filter((i) =>
    ["announcement_bg_color", "announcement_text_color", "announcement_separator_color", "announcement_texts"].includes(i.key),
  );
  const partnerItems = items.filter((i) =>
    ["partners_heading", "partners_logos"].includes(i.key),
  );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSave(); }}
      className="flex flex-col gap-6 max-w-2xl"
    >
      <SectionCard
        title="Announcement Bar"
        description="Scrolling text bar shown at the top of the home page, just below the navbar."
        activeKey="announcement_active"
        isOn={isOn("announcement_active")}
        onToggle={() => toggle("announcement_active")}
      >
        <AdminFieldGroup>
          <AdminFieldSet>
            <AdminFieldGroup>
              {announcementItems.map(renderField)}
            </AdminFieldGroup>
          </AdminFieldSet>
        </AdminFieldGroup>
      </SectionCard>

      <SectionCard
        title="Product Image Marquee"
        description="Scrolling strip of product images shown after Collections on the home page."
        activeKey="product_marquee_active"
        isOn={isOn("product_marquee_active")}
        onToggle={() => toggle("product_marquee_active")}
      >
        <AdminFieldGroup>
          <AdminFieldSet>
            <AdminField>
              <AdminFieldLabel>Products to Show</AdminFieldLabel>
              <ProductPicker
                allProducts={allProducts}
                selectedIds={selectedProductIds}
                onChange={setProductIds}
              />
            </AdminField>
          </AdminFieldSet>
        </AdminFieldGroup>
      </SectionCard>

      <SectionCard
        title="Partner Logos Marquee"
        description="Scrolling partner / brand names shown after the product image strip on the home page."
        activeKey="partners_marquee_active"
        isOn={isOn("partners_marquee_active")}
        onToggle={() => toggle("partners_marquee_active")}
      >
        <AdminFieldGroup>
          <AdminFieldSet>
            <AdminFieldGroup>
              {partnerItems.map(renderField)}
            </AdminFieldGroup>
          </AdminFieldSet>
        </AdminFieldGroup>
      </SectionCard>

      <div>
        <AdminButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </AdminButton>
      </div>
    </form>
  );
}
