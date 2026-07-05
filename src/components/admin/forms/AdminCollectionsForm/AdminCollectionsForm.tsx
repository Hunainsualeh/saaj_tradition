"use client";

import { useEffect, useRef, useState } from "react";
import type { Collection } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  ImageCropDialog,
} from "@/components/admin";
import {
  AdminCollectionsFormData,
  AdminCollectionsFormSchema,
  AdminFormEditCollectionData,
} from "./schema";
import {
  createCollection,
  deleteCollectionById,
  updateCollectionById,
} from "@/lib/server/actions";
import { usePreviewUrl } from "@/hooks";

type AdminCollectionsFormProps = {
  isEditMode?: boolean;
  collectionData?: Collection;
};

export function AdminCollectionsForm(props: AdminCollectionsFormProps) {
  const { isEditMode = false, collectionData } = props;
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
    watch,
    formState: { errors },
  } = useForm<AdminCollectionsFormData>({
    resolver: zodResolver(AdminCollectionsFormSchema(isEditMode)),
    defaultValues: {
      name: collectionData?.name ?? "",
      tagline: collectionData?.tagline ?? "",
      slug: collectionData?.slug ?? "",
      sortOrder: collectionData?.sortOrder ?? 0,
    },
  });

  // Auto-generate slug from name in add mode.
  const slugManuallyEdited = useRef(!!collectionData?.slug);
  const nameValue = watch("name");
  useEffect(() => {
    if (isEditMode || slugManuallyEdited.current) return;
    const generated = nameValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", generated, { shouldValidate: false });
  }, [nameValue, isEditMode, setValue]);

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) {
      toast.error("No file selected");
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Open crop dialog instead of compressing directly
    setCropSrc(URL.createObjectURL(selectedFile));
  };

  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const compressedFile = await imageCompression(croppedFile, {
      maxSizeMB: 0.25,
      maxWidthOrHeight: 800,
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

  const onAddSubmit = async (data: AdminCollectionsFormData) => {
    if (!data.image) {
      toast.error("Image is required");
      return;
    }
    setIsActionLocked(true);
    const payload = { ...data, image: data.image };
    const addRes = await createCollection(payload);
    if (!addRes.success) {
      setIsActionLocked(false);
      toast.error("Error creating collection");
      return;
    }
    toast.success("Collection created successfully!");
    router.back();
  };

  const onEditSubmit = async (data: AdminFormEditCollectionData) => {
    setIsActionLocked(true);
    const editRes = await updateCollectionById(
      collectionData?.id || "",
      data,
    );
    if (!editRes.success) {
      setIsActionLocked(false);
      toast.error("Error updating collection");
      return;
    }
    toast.success("Collection updated successfully!");
    router.back();
  };

  const onDelete = async () => {
    if (!collectionData?.id) return;
    setIsDeleting(true);
    setIsActionLocked(true);
    const res = await deleteCollectionById(collectionData?.id);
    if (!res.success) {
      setIsDeleting(false);
      setIsActionLocked(false);
      toast.error("Error deleting collection");
      return;
    }
    toast.success("Collection deleted successfully!");
    router.back();
  };

  const isBusy = isActionLocked || isDeleting;

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={
          isEditMode
            ? handleSubmit(onEditSubmit)
            : handleSubmit(onAddSubmit)
        }
        className="pt-3"
      >
        <AdminFieldGroup>
          <AdminFieldSet>
            <AdminFieldDescription>
              {isEditMode
                ? "Edit the collection details below."
                : "Fill in details for the new collection below."}
            </AdminFieldDescription>
            <AdminFieldGroup>
              <AdminField>
                <AdminFieldLabel htmlFor="name">Name</AdminFieldLabel>
                <AdminInput id="name" {...register("name")} />
                <AdminFieldError errors={[errors.name]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="tagline">Tagline</AdminFieldLabel>
                <AdminInput id="tagline" {...register("tagline")} />
                <AdminFieldError errors={[errors.tagline]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="slug">Slug</AdminFieldLabel>
                <AdminInput
                  id="slug"
                  {...register("slug", {
                    onChange: () => { slugManuallyEdited.current = true; },
                  })}
                />
                <AdminFieldError errors={[errors.slug]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="sortOrder">
                  Sort Order
                </AdminFieldLabel>
                <AdminInput
                  id="sortOrder"
                  type="number"
                  {...register("sortOrder", { valueAsNumber: true })}
                />
                <AdminFieldError errors={[errors.sortOrder]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="image">
                  Collection Image
                </AdminFieldLabel>
                <AdminInput
                  id="image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <AdminFieldError errors={[errors.image]} />
                {(preview || collectionData?.imageUrl) && (
                  <div className="relative w-60! h-40 mt-2 group">
                    <Image
                      src={preview || collectionData?.imageUrl || ""}
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
                      onClick={() => setCropSrc(preview || collectionData?.imageUrl || null)}
                      className="absolute top-1.5 left-1.5 bg-black/70 hover:bg-black text-white px-2 py-1 rounded text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-center gap-1"
                      aria-label="Re-crop image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
                      Re-crop
                    </button>
                  </div>
                )}
              </AdminField>
            </AdminFieldGroup>
            <div className="flex flex-col gap-3">
              <AdminButton className="flex-1" type="submit" disabled={isBusy}>
                {isActionLocked && !isDeleting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Collection"}
              </AdminButton>
              {isEditMode && (
                <AdminButton
                  type="button"
                  onClick={onDelete}
                  disabled={isBusy}
                  variant="outline"
                  className="flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete Collection"}
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
