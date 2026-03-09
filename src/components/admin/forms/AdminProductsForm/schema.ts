import { SizeTypeEnum } from "@/types/client";
import { z } from "zod";

export const StockStatusEnum = z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"]);

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

      collectionIds: z.array(z.string()).optional(),

      category: z.string().min(1, "Category is required").optional().refine(
        (val) => val !== undefined && val !== "",
        {
          message: "Category is required",
        },
      ),

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

      sizeType: SizeTypeEnum.optional().refine((val) => val !== undefined, {
        message: "Size type is required",
      }),

      selectedSizes: z
        .array(z.string())
        .min(1, "Select at least one size"),

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
