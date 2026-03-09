"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import Image from "next/image";

import {
  AdminButton,
  AdminField,
  AdminFieldDescription,
  AdminFieldError,
  AdminFieldGroup,
  AdminFieldLabel,
  AdminFieldSet,
  AdminInput,
  ImageCropDialog,
} from "@/components/admin";
import { AdminCategoryFormData, AdminCategoryFormSchema } from "./schema";
import {
  createCategory,
  deleteCategoryById,
  updateCategoryById,
} from "@/lib/server/actions";
import { usePreviewUrl } from "@/hooks";

type AdminCategoriesFormProps = {
  isEditMode?: boolean;
  categoryData?: Category;
};

export function AdminCategoriesForm(props: AdminCategoriesFormProps) {
  const { isEditMode = false, categoryData } = props;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionLocked, setIsActionLocked] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const preview = usePreviewUrl(file);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, dirtyFields },
  } = useForm<AdminCategoryFormData>({
    resolver: zodResolver(AdminCategoryFormSchema),
    defaultValues: {
      name: categoryData?.name ?? "",
      slug: categoryData?.slug ?? "",
      tagline: categoryData?.tagline ?? "",
      imageUrl: categoryData?.imageUrl ?? "",
    },
  });

  // Auto-generate slug from name in add mode (or when slug hasn't been
  // manually edited yet in edit mode).
  const nameValue = useWatch({ control, name: "name" });
  useEffect(() => {
    if (isEditMode || dirtyFields.slug) return;
    const generated = nameValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", generated, { shouldValidate: false });
  }, [nameValue, isEditMode, dirtyFields.slug, setValue]);

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) {
      toast.error("No file selected");
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCropSrc(URL.createObjectURL(selectedFile));
  };

  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const compressedFile = await imageCompression(croppedFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    });
    if (compressedFile.size > 1 * 1024 * 1024) {
      toast.error("Error compressing image. Please choose a smaller file.");
      setCropSrc(null);
      return;
    }
    if (!["image/jpeg", "image/png"].includes(compressedFile.type)) {
      toast.error("Only JPEG and PNG formats are accepted");
      setCropSrc(null);
      return;
    }
    setValue("image", compressedFile, { shouldValidate: true });
    setFile(compressedFile);
    setCropSrc(null);
  };

  const handleCropClose = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const onSubmit = async (data: AdminCategoryFormData) => {
    setIsActionLocked(true);
    const res = isEditMode
      ? await updateCategoryById(categoryData?.id || "", data)
      : await createCategory(data);

    if (!res.success) {
      setIsActionLocked(false);
      toast.error(
        isEditMode ? "Error updating category" : "Error creating category",
      );
      return;
    }
    toast.success(
      isEditMode
        ? "Category updated successfully!"
        : "Category created successfully!",
    );
    router.back();
  };

  const onDelete = async () => {
    if (!categoryData?.id) return;
    setIsDeleting(true);
    setIsActionLocked(true);
    const res = await deleteCategoryById(categoryData?.id);
    if (!res.success) {
      setIsDeleting(false);
      setIsActionLocked(false);
      toast.error("Error deleting category");
      return;
    }
    toast.success("Category deleted successfully!");
    router.back();
  };

  const isBusy = isActionLocked || isDeleting;

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="pt-3">
        <AdminFieldGroup>
          <AdminFieldSet>
            <AdminFieldDescription>
              {isEditMode
                ? "Edit the category details below."
                : "Create a new product category."}
            </AdminFieldDescription>
            <AdminFieldGroup>
              <AdminField>
                <AdminFieldLabel htmlFor="name">Name</AdminFieldLabel>
                <AdminInput
                  id="name"
                  {...register("name")}
                  placeholder="e.g. Dresses"
                />
                <AdminFieldError errors={[errors.name]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="slug">Slug</AdminFieldLabel>
                <AdminInput
                  id="slug"
                  {...register("slug")}
                  placeholder="e.g. dresses"
                />
                <AdminFieldError errors={[errors.slug]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="tagline">
                  Tagline (optional)
                </AdminFieldLabel>
                <AdminInput
                  id="tagline"
                  {...register("tagline")}
                  placeholder="e.g. Timeless elegance in every silhouette."
                />
                <AdminFieldError errors={[errors.tagline]} />
              </AdminField>

              {/* IMAGE */}
              <AdminField>
                <AdminFieldLabel htmlFor="image">
                  Category Image (optional)
                </AdminFieldLabel>
                <AdminInput
                  id="image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                />
                <AdminFieldError errors={[errors.image]} />
                {(preview || categoryData?.imageUrl) && (
                  <div className="relative w-60 h-40 mt-2 group">
                    <Image
                      src={preview || categoryData?.imageUrl || ""}
                      alt="Preview"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 240px"
                      className="rounded object-cover"
                    />
                    {/* Remove image button — always visible on mobile */}
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setValue("image", undefined);
                        setValue("imageUrl", "", { shouldValidate: true });
                        clearFileInput();
                      }}
                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1 rounded text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-center gap-1"
                      aria-label="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    {/* Re-crop button — always visible on mobile */}
                    <button
                      type="button"
                      onClick={() => setCropSrc(preview || categoryData?.imageUrl || null)}
                      className="absolute top-1.5 left-1.5 bg-black/70 hover:bg-black text-white px-2 py-1 rounded text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-center gap-1"
                      aria-label="Re-crop image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
                      Re-crop
                    </button>
                  </div>
                )}
              </AdminField>

              <AdminField>
                <AdminFieldLabel htmlFor="imageUrl">
                  Or paste an Image URL (optional)
                </AdminFieldLabel>
                <AdminInput
                  id="imageUrl"
                  {...register("imageUrl")}
                  placeholder="https://example.com/image.jpg"
                  disabled={!!file}
                />
                {file && (
                  <p className="text-xs text-gray-400 mt-1">
                    URL field disabled while a file is selected.{" "}
                    <button
                      type="button"
                      className="underline cursor-pointer"
                      onClick={() => {
                        setFile(null);
                        setValue("image", undefined);
                        clearFileInput();
                      }}
                    >
                      Clear file
                    </button>
                  </p>
                )}
                <AdminFieldError errors={[errors.imageUrl]} />
              </AdminField>
            </AdminFieldGroup>
            <div className="flex flex-col gap-3">
              <AdminButton className="flex-1" type="submit" disabled={isBusy}>
                {isActionLocked && !isDeleting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Category"}
              </AdminButton>
              {isEditMode && (
                <AdminButton
                  type="button"
                  onClick={onDelete}
                  disabled={isBusy}
                  variant="outline"
                  className="flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete Category"}
                </AdminButton>
              )}
            </div>
          </AdminFieldSet>
        </AdminFieldGroup>
      </form>

      <ImageCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc}
        onClose={handleCropClose}
        onCrop={handleCropConfirm}
      />
    </div>
  );
}
