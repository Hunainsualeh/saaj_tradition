import { z } from "zod";

export const StockStatusEnum = z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"]);

// A single size offered for a product. `inStock` drives availability — the
// store sources ready-made stock, so we track "available / out of stock" per
// size rather than unit counts.
export const ProductSizeSchema = z.object({
  label: z.string().min(1, "Size label is required"),
  inStock: z.boolean(),
});

export const AdminProductsFormSchema = (isEditMode: boolean) =>
  z
    .object({
      name: z.string().min(1, "Product name is required"),
      description: z.string().min(1, "Product description is required"),

      price: z.coerce
        .number("Price must be entered")
        .positive("Price must be a positive number")
        .multipleOf(0.01, "Price must be valid"),

      compareAtPrice: z.coerce
        .number()
        .positive("Compare-at price must be positive")
        .multipleOf(0.01, "Compare-at price must be valid")
        .optional()
        .or(z.literal("").transform(() => undefined)),

      shippingCharge: z.coerce
        .number()
        .nonnegative("Shipping charge must be 0 or more")
        .multipleOf(0.01, "Shipping charge must be valid")
        .optional()
        .or(z.literal("").transform(() => undefined)),

      collectionIds: z.array(z.string()).optional(),

      categoryIds: z.array(z.string()).optional(),

      slug: z
        .string()
        .min(1, "Slug is required")
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slug must be lowercase with hyphens only",
        ),

      isActive: z.boolean(),

      isFeatured: z.boolean().optional().default(false),

      stockStatus: StockStatusEnum.default("AVAILABLE"),

      lowStockThreshold: z.coerce
        .number()
        .positive("Low stock threshold must be positive")
        .int("Low stock threshold must be a whole number")
        .optional()
        .or(z.literal("").transform(() => undefined)),

      showLowStockWarning: z.boolean().optional().default(false),

      // Dynamic per-product sizes. Each product defines exactly the sizes it is
      // available in — no fixed size-type assumptions.
      sizes: z
        .array(ProductSizeSchema)
        .min(1, "Add at least one size")
        .refine(
          (sizes) => {
            const labels = sizes.map((s) => s.label.trim().toLowerCase());
            return new Set(labels).size === labels.length;
          },
          { message: "Duplicate sizes are not allowed" },
        ),

      images: isEditMode
        ? z.array(z.instanceof(File)).optional()
        : z
            .array(z.instanceof(File), {
              message: "At least two images are required",
            })
            .min(2, { message: "At least two images are required" }),

      imageUrls: z.array(z.string()).optional(),
    })
    .refine(
      (data) => {
        if (isEditMode) {
          const totalImages =
            (data.imageUrls?.length || 0) + (data.images?.length || 0);
          return totalImages >= 2;
        }
        return true;
      },
      {
        message: "At least two images are required",
        path: ["images"],
      },
    );

export type AdminProductsFormData = z.infer<
  ReturnType<typeof AdminProductsFormSchema>
> & {
  imageUrls?: string[];
};

export type AdminProductsFormNoFileData = Omit<AdminProductsFormData, "images">;
