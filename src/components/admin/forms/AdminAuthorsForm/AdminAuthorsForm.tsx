"use client";

import { useRef, useState } from "react";
import type { Author } from "@prisma/client";
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
} from "@/components/admin";
import {
  AdminAuthorsFormData,
  AdminAuthorsFormSchema,
  AdminFormEditAuthorsData,
} from "./schema";
import {
  createAuthor,
  deleteAuthorById,
  updateAuthorById,
} from "@/lib/server/actions";
import { usePreviewUrl } from "@/hooks";

type AdminAuthorsFormProps = {
  isEditMode?: boolean;
  authorData?: Author;
};

export function AdminAuthorsForm(props: AdminAuthorsFormProps) {
  // === PROPS ===
  const { isEditMode = false, authorData } = props;

  // === ROUTES ===
  const router = useRouter();

  // === REFS ===
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === STATE ===
  const [file, setFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionLocked, setIsActionLocked] = useState(false);

  // === HOOKS ===
  const preview = usePreviewUrl(file);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminAuthorsFormData>({
    resolver: zodResolver(AdminAuthorsFormSchema(isEditMode)),
    defaultValues: {
      name: authorData?.name,
      occupation: authorData?.occupation,
    },
  });

  // === FUNCTIONS ===
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

    const compressedFile = await imageCompression(selectedFile, {
      maxSizeMB: 0.25, // ~250kb
      maxWidthOrHeight: 800,
      useWebWorker: true,
    });

    if (compressedFile.size > 1 * 1024 * 1024) {
      toast.error("Error compressing image. Please choose a smaller file.");
      clearFileInput();
      return;
    }

    if (!["image/jpeg", "image/png"].includes(compressedFile.type)) {
      toast.error("Only JPEG and PNG formats are accepted");
      clearFileInput();
      return;
    }

    setValue("image", compressedFile, { shouldValidate: true });
    setFile(compressedFile);
  };

  const onAddSubmit = async (data: AdminAuthorsFormData) => {
    if (!data.image) {
      toast.error("Image is required");
      return;
    }

    setIsActionLocked(true);

    const payload = {
      ...data,
      image: data.image,
    };

    const addRes = await createAuthor(payload);

    if (!addRes.success) {
      setIsActionLocked(false);
      toast.error("Error creating author");
      return;
    }

    toast.success("Author created successfully!");
    router.back();
  };

  const onEditSubmit = async (data: AdminFormEditAuthorsData) => {
    setIsActionLocked(true);

    const editRes = await updateAuthorById(authorData?.id || "", data);

    if (!editRes.success) {
      setIsActionLocked(false);
      toast.error("Error updating author");
      return;
    }

    toast.success("Author updated successfully!");
    router.back();
  };

  const onDelete = async () => {
    if (!authorData?.id) return;

    setIsDeleting(true);
    setIsActionLocked(true);

    const res = await deleteAuthorById(authorData?.id);

    if (!res.success) {
      setIsDeleting(false);
      setIsActionLocked(false);
      toast.error("Error deleting author");
      return;
    }

    toast.success("Author deleted successfully!");
    router.back();
  };

  const isBusy = isActionLocked || isDeleting;

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={
          isEditMode ? handleSubmit(onEditSubmit) : handleSubmit(onAddSubmit)
        }
        className="pt-3"
      >
        <AdminFieldGroup>
          <AdminFieldSet>
            <AdminFieldDescription>
              {isEditMode
                ? "Edit the author details below."
                : "Fill in details for the new author below."}
            </AdminFieldDescription>

            <AdminFieldGroup>
              {/* NAME */}
              <AdminField>
                <AdminFieldLabel htmlFor="name">Name</AdminFieldLabel>
                <AdminInput id="name" {...register("name")} />
                <AdminFieldError errors={[errors.name]} />
              </AdminField>

              {/* OCCUPATION */}
              <AdminField>
                <AdminFieldLabel htmlFor="occupation">
                  Occupation
                </AdminFieldLabel>
                <AdminInput id="occupation" {...register("occupation")} />
                <AdminFieldError errors={[errors.occupation]} />
              </AdminField>

              {/* IMAGE */}
              <AdminField>
                <AdminFieldLabel htmlFor="image">Profile Image</AdminFieldLabel>

                <AdminInput
                  id="image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <AdminFieldError errors={[errors.image]} />

                {(preview || authorData?.avatarUrl) && (
                  <div className="relative w-60! h-60 mt-2">
                    <Image
                      src={preview || authorData?.avatarUrl || ""}
                      alt="Preview"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 240px"
                      className="rounded object-cover"
                    />
                  </div>
                )}
              </AdminField>
            </AdminFieldGroup>

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
                    : "Create Author"}
              </AdminButton>

              {/* Delete Button */}
              {isEditMode && (
                <AdminButton
                  type="button" // Prevents form submission
                  onClick={onDelete}
                  disabled={isBusy}
                  variant="outline"
                  className="flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete Author"}
                </AdminButton>
              )}
            </div>
          </AdminFieldSet>
        </AdminFieldGroup>
      </form>
    </div>
  );
}
