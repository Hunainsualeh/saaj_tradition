export const SIZE_TYPES = {
  STANDARD: "Standard",
  SHOE: "ShoeSize",
  ONE_SIZE: "OneSize",
} as const;

// Label used for a product that comes in a single, non-sized variant.
export const ONE_SIZE_LABEL = "One Size";

// Common ready-to-wear clothing sizes offered as quick-add chips in the admin
// product form. Admins can also type any custom label (e.g. "38", "Free Size").
export const COMMON_CLOTHING_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "3XL",
] as const;

// Reseller "availability" stock model — we don't track real unit counts.
// An available size gets a high sentinel so cart reservations never block a
// sale; an out-of-stock size gets 0. The product page derives availability from
// `stockTotal - stockReserved`.
export const IN_STOCK_QTY = 999999;
export const OUT_OF_STOCK_QTY = 0;

export const SIZE_TEMPLATES = {
  [SIZE_TYPES.STANDARD]: [
    "XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL",
  ],
  [SIZE_TYPES.SHOE]: [
    "EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46",
    "UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12",
    "US 5", "US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12", "US 13",
  ],
  [SIZE_TYPES.ONE_SIZE]: ["One Size"],
};
