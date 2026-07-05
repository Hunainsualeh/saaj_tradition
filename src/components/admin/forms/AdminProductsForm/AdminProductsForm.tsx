"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useForm, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

import {
  AdminButton,
  AdminField,
  AdminFieldDescription,
  AdminFieldError,
  AdminFieldGroup,
  AdminFieldLabel,
  AdminFieldSet,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminSelectTrigger,
  AdminSelectValue,
  AdminSelectContent,
  AdminSelectGroup,
  AdminSelectItem,
  AdminCheckbox,
} from "@/components/admin";

// Code-split the crop dialog (pulls in the heavy `cropperjs` lib) so it loads
// only when the admin actually crops an image, not on initial form render.
const ImageCropDialog = dynamic(
  () =>
    import("@/components/admin/ui/ImageCropDialog").then(
      (m) => m.ImageCropDialog,
    ),
  { ssr: false },
);

import { AdminProductsFormData, AdminProductsFormSchema } from "./schema";

import {
  roundToTwoDecimals,
  API_ROUTES,
  COMMON_CLOTHING_SIZES,
  ONE_SIZE_LABEL,
} from "@/lib";
import {
  createProduct,
  deleteProductById,
  updateProductById,
} from "@/lib/server/actions";
import { usePreviewUrls } from "@/hooks";
import { CloseIcon } from "@/components/icons";

type CategoryOption = { id: string; name: string };
type CollectionOption = { id: string; name: string };

type ProductSize = { label: string; inStock: boolean };

type ProductFormData = {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  slug: string;
  categoryIds?: string[];
  collectionIds?: string[];
  /** Existing sizes with availability (for edit mode pre-fill) */
  existingSizes?: ProductSize[];
  stockStatus?: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
  lowStockThreshold?: number | null;
  showLowStockWarning?: boolean;
  shippingCharge?: number | null;
};

type AdminProductsFormProps = {
  isEditMode?: boolean;
  productData?: ProductFormData;
  availableCollections?: CollectionOption[];
  availableCategories?: CategoryOption[];
};

export function AdminProductsForm(props: AdminProductsFormProps) {
  // === PROPS ===
  const { isEditMode = false, productData, availableCollections = [], availableCategories = [] } = props;

  // === ROUTES ===
  const router = useRouter();

  // === REFS ===
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === STATE ===
  const [files, setFiles] = useState<File[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionLocked, setIsActionLocked] = useState(false);
  const [customSize, setCustomSize] = useState("");
  /** Queue of object URLs waiting to be cropped (for multi-file selection) */
  const [cropQueue, setCropQueue] = useState<{ src: string; name: string }[]>([]);
  const [activeCrop, setActiveCrop] = useState<{ src: string; name: string } | null>(null);
  /**
   * Re-crop state — triggered by clicking the crop icon on an existing image.
   * savedUrl is set when re-cropping a saved URL; fileIndex when re-cropping a
   * newly-added file that hasn't been uploaded yet.
   */
  const [reCrop, setReCrop] = useState<{
    src: string;
    name: string;
    savedUrl: string | null;
    fileIndex: number | null;
  } | null>(null);

  // === HOOKS ===
  const newImagePreviews = usePreviewUrls(files);
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AdminProductsFormSchema(isEditMode)),
    defaultValues: {
      name: productData?.name,
      description: productData?.description,
      price: productData?.price
        ? Number(productData.price).toFixed(2)
        : undefined,
      compareAtPrice: productData?.compareAtPrice
        ? Number(productData.compareAtPrice).toFixed(2)
        : "",
      categoryIds: productData?.categoryIds ?? [],
      slug: productData?.slug,
      sizes: productData?.existingSizes ?? [],
      isActive: productData?.isActive ?? true,
      isFeatured: productData?.isFeatured ?? false,
      imageUrls: productData?.images || [],
      collectionIds: productData?.collectionIds || [],
      stockStatus: productData?.stockStatus ?? "AVAILABLE",
      lowStockThreshold: productData?.lowStockThreshold ?? undefined,
      showLowStockWarning: productData?.showLowStockWarning ?? false,
      shippingCharge: productData?.shippingCharge != null
        ? Number(productData.shippingCharge).toFixed(2)
        : "",
    },
  });

  // === WATCHERS ===
  const categoryIdsValue = watch("categoryIds") || [];
  const sizesValue = watch("sizes") ?? [];
  const isActiveValue = watch("isActive");
  const isFeaturedValue = watch("isFeatured");
  const imageUrlsValue = watch("imageUrls");
  const collectionIdsValue = watch("collectionIds") || [];
  const nameValue = watch("name");
  const stockStatusValue = watch("stockStatus");
  const showLowStockWarningValue = watch("showLowStockWarning");

  // Auto-generate slug from name in add mode.
  const slugManuallyEdited = useRef(!!productData?.slug);
  useEffect(() => {
    if (isEditMode || slugManuallyEdited.current) return;
    const generated = (nameValue ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", generated, { shouldValidate: false });
  }, [nameValue, isEditMode, setValue]);

  // === MEMOS ===
  const savedImageUrls = useMemo(() => imageUrlsValue || [], [imageUrlsValue]);

  const allImagePreviews = useMemo(() => {
    if (!productData) {
      return newImagePreviews;
    }
    return [...savedImageUrls, ...newImagePreviews];
  }, [newImagePreviews, savedImageUrls, productData]);

  // === SIZE HELPERS ===
  const isOneSize =
    sizesValue.length === 1 && sizesValue[0].label === ONE_SIZE_LABEL;

  const hasSizeLabel = (label: string) =>
    sizesValue.some(
      (s) => s.label.trim().toLowerCase() === label.trim().toLowerCase(),
    );

  const setSizes = (next: ProductSize[]) =>
    setValue("sizes", next, { shouldValidate: true });

  const toggleCommonSize = (label: string) => {
    if (hasSizeLabel(label)) {
      setSizes(
        sizesValue.filter(
          (s) => s.label.toLowerCase() !== label.toLowerCase(),
        ),
      );
    } else {
      setSizes([...sizesValue, { label, inStock: true }]);
    }
  };

  const handleAddCustomSize = () => {
    const label = customSize.trim();
    if (!label) return;
    if (hasSizeLabel(label)) {
      toast.error(`"${label}" is already added`);
      return;
    }
    setSizes([...sizesValue, { label, inStock: true }]);
    setCustomSize("");
  };

  const removeSizeAt = (index: number) =>
    setSizes(sizesValue.filter((_, i) => i !== index));

  const toggleSizeStockAt = (index: number) =>
    setSizes(
      sizesValue.map((s, i) =>
        i === index ? { ...s, inStock: !s.inStock } : s,
      ),
    );

  const toggleOneSize = () => {
    if (isOneSize) {
      setSizes([]);
    } else {
      setSizes([{ label: ONE_SIZE_LABEL, inStock: true }]);
    }
  };

  // === FUNCTIONS ===
  const compressImage = async (file: File): Promise<File | null> => {
    try {
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      if (compressedBlob.size > 1 * 1024 * 1024) {
        toast.error(
          `Error compressing ${file.name}. Please choose smaller files.`,
        );
        return null;
      }

      if (!["image/jpeg", "image/png"].includes(compressedBlob.type)) {
        toast.error(`${file.name}: Only JPEG and PNG formats are accepted`);
        return null;
      }

      return new File([compressedBlob], file.name, {
        type: compressedBlob.type,
        lastModified: Date.now(),
      });
    } catch {
      toast.error(`Failed to compress ${file.name}`);
      return null;
    }
  };

  const handleRemoveImage = (index: number, previewUrl: string) => {
    // TO DO: Refactor to not calculate offset
    if (savedImageUrls.includes(previewUrl)) {
      const updatedUrls = savedImageUrls.filter((url) => url !== previewUrl);
      setValue("imageUrls", updatedUrls, { shouldValidate: true });
      return;
    }

    const offsetPreExistingCount = index - (productData?.images.length || 0);
    const newFiles = files.filter((_, i) => i !== offsetPreExistingCount);

    setFiles(newFiles);
    setValue("images", newFiles.length > 0 ? newFiles : undefined, {
      shouldValidate: true,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) {
      toast.error("No files selected");
      return;
    }

    // Reset input so the same file can be re-selected after cropping
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Build object-URL queue for the crop dialog
    const queue = selectedFiles.map((f) => ({
      src: URL.createObjectURL(f),
      name: f.name,
    }));

    setActiveCrop(queue[0]);
    setCropQueue(queue.slice(1));
  };

  const handleCropConfirm = async (croppedFile: File) => {
    if (!isMounted.current) return;
    // Revoke the just-cropped object URL
    if (activeCrop) URL.revokeObjectURL(activeCrop.src);

    const compressed = await compressImage(croppedFile);
    if (!isMounted.current) return;
    if (compressed) {
      const updated = [...files, compressed];
      setFiles(updated);
      setValue("images", updated, { shouldValidate: true });
    }

    // Advance the queue
    const [next, ...rest] = cropQueue;
    setActiveCrop(next ?? null);
    setCropQueue(rest);
  };

  const handleCropClose = () => {
    if (!isMounted.current) return;
    // Revoke all pending object URLs to free memory
    if (activeCrop) URL.revokeObjectURL(activeCrop.src);
    cropQueue.forEach((item) => URL.revokeObjectURL(item.src));
    setActiveCrop(null);
    setCropQueue([]);
  };

  // === RE-CROP handlers ===
  const handleReCropSaved = (savedUrl: string) => {
    setReCrop({ src: savedUrl, name: "recropped.jpg", savedUrl, fileIndex: null });
  };

  const handleReCropNewFile = (fileIndex: number) => {
    const file = files[fileIndex];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setReCrop({ src: blobUrl, name: file.name, savedUrl: null, fileIndex });
  };

  const handleReCropConfirm = async (croppedFile: File) => {
    if (!isMounted.current) return;
    if (!reCrop) return;
    const snap = reCrop;
    setReCrop(null);

    if (snap.savedUrl) {
      // Remove the old saved URL and push the newly cropped file as a new upload
      const updatedUrls = savedImageUrls.filter((u) => u !== snap.savedUrl);
      setValue("imageUrls", updatedUrls, { shouldValidate: true });
    } else if (snap.fileIndex !== null) {
      URL.revokeObjectURL(snap.src);
    }

    const compressed = await compressImage(croppedFile);
    if (!isMounted.current) return;
    if (compressed) {
      let updated: File[];
      if (snap.fileIndex !== null) {
        // Replace in-place
        updated = files.map((f, i) => (i === snap.fileIndex ? compressed : f));
      } else {
        updated = [...files, compressed];
      }
      setFiles(updated);
      setValue("images", updated, { shouldValidate: true });
    }
  };

  const handleReCropClose = () => {
    if (!isMounted.current) return;
    if (reCrop && reCrop.fileIndex !== null) URL.revokeObjectURL(reCrop.src);
    setReCrop(null);
  };

  const handleProductSubmit = async ({
    data,
    isEdit = false,
    productId,
    existingImageUrls = [],
  }: {
    data: AdminProductsFormData;
    isEdit?: boolean;
    productId?: string;
    existingImageUrls?: string[];
  }) => {
    if (!isMounted.current) return;
    try {
      let uploadedUrls: string[] = [];

      if (data.images?.length) {
        const fd = new FormData();
        data.images.forEach((file) => fd.append("files", file));

        const uploadRes = await fetch(API_ROUTES.PRODUCTS.UPLOAD, {
          method: "POST",
          body: fd,
        });

        if (!uploadRes.ok) throw new Error("Image upload failed");

        const { urls } = await uploadRes.json();

        if (
          !Array.isArray(urls) ||
          urls.length === 0 ||
          urls.some((url) => !url)
        ) {
          throw new Error("No valid URLs returned from upload");
        }

        uploadedUrls = urls;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { images, ...dataNoFiles } = data;
      const allImageUrls = isEdit
        ? [...existingImageUrls, ...uploadedUrls]
        : uploadedUrls;

      const result = isEdit
        ? await updateProductById(productId || "", {
            ...dataNoFiles,
            imageUrls: allImageUrls,
          })
        : await createProduct({ ...dataNoFiles, imageUrls: allImageUrls });

      if (!result.success) {
        throw new Error(
          isEdit ? "Failed to update product" : "Failed to create product",
        );
      }

      if (!isMounted.current) return;
      toast.success(
        isEdit
          ? "Product updated successfully!"
          : "Product created successfully!",
      );
      router.back();
    } catch (err) {
      console.error(err);
      if (isMounted.current) {
        setIsActionLocked(false);
        toast.error("An unexpected error occurred");
      }
    }
  };
  const onAddSubmit = (data: AdminProductsFormData) => {
    setIsActionLocked(true);
    void handleProductSubmit({ data });
  };

  const onEditSubmit = (data: AdminProductsFormData) => {
    setIsActionLocked(true);
    void handleProductSubmit({
      data,
      isEdit: true,
      productId: productData?.id,
      existingImageUrls: savedImageUrls,
    });
  };

  const onDelete = async () => {
    if (!productData?.id) return;

    setIsDeleting(true);
    setIsActionLocked(true);

    const res = await deleteProductById(productData?.id);

    if (!res.success) {
      setIsDeleting(false);
      setIsActionLocked(false);
      toast.error("Error deleting product");
      return;
    }

    toast.success("Product deleted successfully!");
    router.back();
  };

  const isBusy = isActionLocked || isDeleting;

  return (
    <div className="w-full max-w-6xl">
      <form
        onSubmit={
          isEditMode ? handleSubmit(onEditSubmit) : handleSubmit(onAddSubmit)
        }
        className="pt-3"
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* MAIN COLUMN — core details */}
          <AdminFieldSet className="xl:col-span-2">
            <AdminFieldDescription>
              {isEditMode
                ? "Edit the product details below."
                : "Fill in details for the new product below."}
            </AdminFieldDescription>

            <AdminFieldGroup>
              {/* NAME */}
              <AdminField>
                <AdminFieldLabel htmlFor="productName">Name</AdminFieldLabel>
                <AdminInput id="productName" {...register("name")} />
                <AdminFieldError errors={[errors.name]} />
              </AdminField>

              {/* DESCRIPTION */}
              <AdminField>
                <AdminFieldLabel htmlFor="productDescription">
                  Description
                </AdminFieldLabel>
                <AdminTextarea
                  id="productDescription"
                  {...register("description")}
                  rows={4}
                />
                <AdminFieldError errors={[errors.description]} />
              </AdminField>

              {/* PRICE */}
              <AdminField>
                <AdminFieldLabel htmlFor="price">Price (Rs.)</AdminFieldLabel>
                <AdminInput
                  id="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  {...register("price", {
                    setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                    onBlur: (e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const rounded = roundToTwoDecimals(parseFloat(v));
                      setValue("price", rounded, { shouldValidate: true });
                      e.target.value = rounded.toFixed(2);
                    },
                  })}
                />
                <AdminFieldError errors={[errors.price]} />
              </AdminField>

              {/* COMPARE AT PRICE (SALE) */}
              <AdminField>
                <AdminFieldLabel htmlFor="compareAtPrice">
                  Compare-at Price (Rs.)
                </AdminFieldLabel>
                <AdminFieldDescription>
                  Original price before sale. Leave empty if not on sale. Must be
                  higher than the sale price above.
                </AdminFieldDescription>
                <AdminInput
                  id="compareAtPrice"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="e.g., 49.99"
                  {...register("compareAtPrice", {
                    setValueAs: (v) =>
                      v === "" ? undefined : parseFloat(v),
                    onBlur: (e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const rounded = roundToTwoDecimals(parseFloat(v));
                      setValue("compareAtPrice", rounded, {
                        shouldValidate: true,
                      });
                      e.target.value = rounded.toFixed(2);
                    },
                  })}
                />
                <AdminFieldError errors={[errors.compareAtPrice]} />
              </AdminField>

              {/* SHIPPING CHARGE OVERRIDE */}
              <AdminField>
                <AdminFieldLabel htmlFor="shippingCharge">
                  Shipping Cost (Rs.)
                </AdminFieldLabel>
                <AdminFieldDescription>
                  Per-product shipping charge. Leave empty to use the global rate set in Shipping Settings.
                </AdminFieldDescription>
                <AdminInput
                  id="shippingCharge"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 200.00"
                  {...register("shippingCharge", {
                    setValueAs: (v) =>
                      v === "" ? undefined : parseFloat(v),
                    onBlur: (e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const rounded = roundToTwoDecimals(parseFloat(v));
                      setValue("shippingCharge", rounded, {
                        shouldValidate: true,
                      });
                      e.target.value = rounded.toFixed(2);
                    },
                  })}
                />
                <AdminFieldError errors={[errors.shippingCharge]} />
              </AdminField>

              {/* IMAGES */}
              <AdminField>
                <AdminFieldLabel htmlFor="productImages">
                  Product Images
                </AdminFieldLabel>
                <AdminFieldDescription>
                  Each image will open a cropper so you can adjust before uploading.
                </AdminFieldDescription>
                <AdminInput
                  id="productImages"
                  className="hidden"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
                <AdminButton
                  className="w-fit!"
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Files
                </AdminButton>
                {allImagePreviews.length > 0 && (
                  <AdminFieldDescription>
                    {allImagePreviews.length}{" "}
                    {allImagePreviews.length === 1 ? "file" : "files"} selected
                  </AdminFieldDescription>
                )}
                <AdminFieldError errors={[errors.images]} />

                {(allImagePreviews.length > 0 ||
                  productData?.images.length) && (
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {allImagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative w-full aspect-square group"
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          priority
                          quality={60}
                          sizes="(max-width: 768px) 100vw, 240px"
                          className="rounded object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index, preview)}
                          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black backdrop-blur-sm text-white p-1 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                          aria-label="Remove image"
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                        {/* Re-crop button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (savedImageUrls.includes(preview)) {
                              handleReCropSaved(preview);
                            } else {
                              handleReCropNewFile(index - savedImageUrls.length);
                            }
                          }}
                          className="absolute top-1.5 left-1.5 bg-black/70 hover:bg-black backdrop-blur-sm text-white p-1 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                          aria-label="Re-crop image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                            <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </AdminField>
            </AdminFieldGroup>

            {/* SLUG */}
            <AdminField>
              <AdminFieldLabel htmlFor="productSlug">Slug</AdminFieldLabel>
              <AdminInput
                id="productSlug"
                {...register("slug", {
                  onChange: () => { slugManuallyEdited.current = true; },
                })}
                placeholder="e.g., organic-cotton-tee"
              />
              <AdminFieldError errors={[errors.slug]} />
            </AdminField>

            {/* CATEGORY — multi-select (like Collections) */}
            <AdminField>
              <AdminFieldLabel htmlFor="productCategory">
                Categories
              </AdminFieldLabel>
              <AdminFieldDescription>
                Select all categories this product belongs to.
              </AdminFieldDescription>
              {availableCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {availableCategories.map((cat) => {
                    const isSelected = categoryIdsValue.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? categoryIdsValue.filter((id) => id !== cat.id)
                            : [...categoryIdsValue, cat.id];
                          setValue("categoryIds", updated);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-10 border-neutral-04 hover:border-black"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-neutral-09">No categories available.</p>
              )}
              <AdminFieldError errors={[errors.categoryIds as FieldError | undefined]} />
            </AdminField>

            {/* COLLECTIONS */}
            {availableCollections.length > 0 && (
              <AdminField>
                <AdminFieldLabel>Collections</AdminFieldLabel>
                <AdminFieldDescription>
                  Select which collections this product belongs to.
                </AdminFieldDescription>
                <div className="flex flex-wrap gap-2 mt-1">
                  {availableCollections.map((col) => {
                    const isSelected = collectionIdsValue.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? collectionIdsValue.filter(
                                (id) => id !== col.id,
                              )
                            : [...collectionIdsValue, col.id];
                          setValue("collectionIds", updated);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-10 border-neutral-04 hover:border-black"
                        }`}
                      >
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </AdminField>
            )}

            {/* SIZES */}
            <AdminField>
              <AdminFieldLabel htmlFor="productSizes">Sizes</AdminFieldLabel>
              <AdminFieldDescription>
                Add the sizes this product is available in. Toggle a size to
                &ldquo;Out of stock&rdquo; to keep it listed but unselectable for
                customers.
              </AdminFieldDescription>

              {/* One Size toggle */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOneSize}
                  onClick={toggleOneSize}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    isOneSize ? "bg-neutral-900" : "bg-neutral-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      isOneSize ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-neutral-700">
                  One Size (no size options)
                </span>
              </div>

              {!isOneSize && (
                <>
                  {/* Quick add common sizes */}
                  <div className="mt-3">
                    <AdminFieldDescription>Quick add</AdminFieldDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {COMMON_CLOTHING_SIZES.map((label) => {
                        const added = hasSizeLabel(label);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleCommonSize(label)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                              added
                                ? "bg-black text-white border-black"
                                : "bg-white text-neutral-600 border-neutral-300 hover:border-black"
                            }`}
                          >
                            {added ? "✓ " : "+ "}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom size input */}
                  <div className="mt-3 flex items-center gap-2">
                    <AdminInput
                      id="productSizes"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSize();
                        }
                      }}
                      placeholder="Add custom size (e.g. 38, Free Size)"
                      className="max-w-xs"
                    />
                    <AdminButton
                      type="button"
                      variant="outline"
                      className="w-fit!"
                      onClick={handleAddCustomSize}
                    >
                      Add
                    </AdminButton>
                  </div>

                  {/* Selected sizes with per-size availability */}
                  {sizesValue.length > 0 && (
                    <div className="mt-4">
                      <AdminFieldDescription>Your sizes</AdminFieldDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sizesValue.map((size, index) => (
                          <div
                            key={size.label}
                            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white py-1 pl-3 pr-1.5"
                          >
                            <span className="text-sm font-medium text-neutral-800">
                              {size.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSizeStockAt(index)}
                              className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                                size.inStock
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >
                              {size.inStock ? "In stock" : "Out of stock"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSizeAt(index)}
                              aria-label={`Remove ${size.label}`}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                              <CloseIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <AdminFieldError errors={[errors.sizes as FieldError | undefined]} />
            </AdminField>
          </AdminFieldSet>

          {/* SIDE COLUMN — visibility & availability */}
          <div className="flex flex-col gap-6">
            <AdminFieldSet>
            {/* NEW ARRIVALS (isFeatured) */}
            <AdminField>
              <AdminFieldLabel>New Arrivals</AdminFieldLabel>
              <AdminFieldDescription>
                Show this product in the New Arrivals section on the home page.
              </AdminFieldDescription>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFeaturedValue}
                  onClick={() => setValue("isFeatured", !isFeaturedValue)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
                    isFeaturedValue ? "bg-neutral-900" : "bg-neutral-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isFeaturedValue ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${isFeaturedValue ? "text-neutral-900" : "text-neutral-400"}`}>
                  {isFeaturedValue ? "Enabled" : "Disabled"}
                </span>
              </div>
              <AdminFieldError errors={[errors.isFeatured]} />
            </AdminField>

            {/* IS ACTIVE */}
            <AdminField>
              <AdminFieldLabel htmlFor="isActive">Active</AdminFieldLabel>
              <div>
                <AdminCheckbox
                  id="isActive"
                  className="w-4"
                  checked={isActiveValue}
                  onCheckedChange={(checked) =>
                    setValue("isActive", checked as boolean)
                  }
                />
              </div>
              <AdminFieldError errors={[errors.isActive]} />
            </AdminField>

            {/* AVAILABILITY */}
            <AdminField>
              <AdminFieldLabel htmlFor="stockStatus">Availability</AdminFieldLabel>
              <AdminFieldDescription>
                Master availability for the whole product. Use the Sizes section
                above to mark individual sizes out of stock. &ldquo;Out of
                Stock&rdquo; hides the buy button entirely.
              </AdminFieldDescription>
              <AdminSelect
                value={stockStatusValue ?? "AVAILABLE"}
                onValueChange={(val) => {
                  setValue("stockStatus", val as "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK", {
                    shouldValidate: true,
                  });
                }}
              >
                <AdminSelectTrigger id="stockStatus">
                  <AdminSelectValue />
                </AdminSelectTrigger>
                <AdminSelectContent>
                  <AdminSelectGroup>
                    <AdminSelectItem value="AVAILABLE">In Stock</AdminSelectItem>
                    <AdminSelectItem value="LOW_STOCK">Low Stock (running low)</AdminSelectItem>
                    <AdminSelectItem value="OUT_OF_STOCK">Out of Stock</AdminSelectItem>
                  </AdminSelectGroup>
                </AdminSelectContent>
              </AdminSelect>
              <AdminFieldError errors={[errors.stockStatus]} />
            </AdminField>

            {/* LOW STOCK THRESHOLD (shown when LOW_STOCK is selected) */}
            {stockStatusValue === "LOW_STOCK" && (
              <AdminField>
                <AdminFieldLabel htmlFor="lowStockThreshold">
                  Low Stock Threshold (optional)
                </AdminFieldLabel>
                <AdminFieldDescription>
                  Leave empty to show warning without numbers. Enter a number to show &ldquo;Only X left in stock&rdquo;.
                </AdminFieldDescription>
                <AdminInput
                  id="lowStockThreshold"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g., 5"
                  {...register("lowStockThreshold", {
                    setValueAs: (v) => (v === "" ? undefined : parseInt(v)),
                  })}
                />
                <AdminFieldError errors={[errors.lowStockThreshold]} />
              </AdminField>
            )}

            {/* SHOW LOW STOCK WARNING (shown when LOW_STOCK is selected) */}
            {stockStatusValue === "LOW_STOCK" && (
              <AdminField>
                <AdminFieldLabel>Show Low Stock Warning</AdminFieldLabel>
                <AdminFieldDescription>
                  Enable to display a warning message on the product page.
                </AdminFieldDescription>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showLowStockWarningValue}
                    onClick={() => setValue("showLowStockWarning", !showLowStockWarningValue)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
                      showLowStockWarningValue ? "bg-neutral-900" : "bg-neutral-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        showLowStockWarningValue ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${showLowStockWarningValue ? "text-neutral-900" : "text-neutral-400"}`}>
                    {showLowStockWarningValue ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <AdminFieldError errors={[errors.showLowStockWarning]} />
              </AdminField>
            )}
            </AdminFieldSet>

            {/* SUBMIT */}
            <div className="flex flex-col gap-3">
              <AdminButton
                className="flex-1"
                type="submit"
                disabled={isBusy}
              >
                {isActionLocked && !isDeleting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Product"}
              </AdminButton>

              {/* Delete Button */}
              {isEditMode && (
                <AdminButton
                  type="button"
                  onClick={onDelete}
                  disabled={isBusy}
                  variant="outline"
                  className="flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete Product"}
                </AdminButton>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Image crop dialog — opens automatically for each selected file */}
      <ImageCropDialog
        open={!!activeCrop}
        imageSrc={activeCrop?.src ?? null}
        fileName={activeCrop?.name}
        onClose={handleCropClose}
        onCrop={handleCropConfirm}
      />

      {/* Re-crop dialog — opened by clicking the crop icon on an existing image */}
      <ImageCropDialog
        open={!!reCrop}
        imageSrc={reCrop?.src ?? null}
        fileName={reCrop?.name}
        onClose={handleReCropClose}
        onCrop={handleReCropConfirm}
      />
    </div>
  );
}
