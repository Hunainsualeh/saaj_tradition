import { z } from "zod";

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only",
    ),
  sortOrder: z.number().int().min(0, "Sort order must be >= 0"),
});

export const AdminCollectionsFormSchema = (isEditMode: boolean) =>
  baseSchema.extend({
    image: isEditMode
      ? z.instanceof(Blob).optional()
      : z
          .instanceof(Blob, { message: "Image is required" })
          .refine((file) => file?.size > 0, "Image is required")
          .refine(
            (file) => file.size <= 1 * 1024 * 1024,
            "Max file size is 1MB",
          )
          .refine(
            (file) => ["image/jpeg", "image/png"].includes(file.type),
            "Only JPEG and PNG formats are accepted",
          ),
  });

export type AdminCollectionsFormData = z.output<
  ReturnType<typeof AdminCollectionsFormSchema>
>;
export type AdminFormEditCollectionData = AdminCollectionsFormData;
export type AdminFormAddCollectionData = Omit<
  AdminCollectionsFormData,
  "image"
> & { image: Blob };
