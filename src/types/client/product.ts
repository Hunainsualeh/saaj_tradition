import z from "zod";

// === ENUMS ===
export const SizeTypeEnum = z.enum(["Standard", "ShoeSize", "OneSize"]);
export type SizeTypeEnum = z.infer<typeof SizeTypeEnum>;

// === SERIALIZED PRODUCT (Decimals converted to numbers) ===
export type SerializedProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  slug: string;
  categoryId: string | null;
  category?: { name: string; slug: string } | null;
  sizeType: string | null;
};

// === PRODUCT WITH ORDER ITEM COUNTS ===
export type ProductGetAllCounts = {
  id: string;
  name: string;
  description: string;
  price: number; // Converted from Decimal
  compareAtPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  slug: string;
  categoryId: string | null;
  categoryName: string;
  sizeType: string | null;
  totalSold: number;
};

// === PRODUCT WITH SIZES ===
export type ProductWithSizes = {
  id: string;
  name: string;
  description: string;
  price: number; // Converted from Decimal
  compareAtPrice: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  slug: string;
  categoryId: string | null;
  category?: { name: string; slug: string } | null;
  sizeType: string | null;
  sizes: Array<{
    id: string;
    label: string;
    productId: string;
    stockTotal: number;
    stockReserved: number;
  }>;
  stockStatus?: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
  lowStockThreshold?: number | null;
  showLowStockWarning?: boolean;
};

// === DASHBOARD STATS ===
export type ProductDashboardStats = {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
};
