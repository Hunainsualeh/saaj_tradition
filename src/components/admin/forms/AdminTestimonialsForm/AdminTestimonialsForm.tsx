"use client";

import { useRef, useState } from "react";
import type { Testimonial } from "@prisma/client";
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
  AdminTestimonialsFormData,
  AdminTestimonialsFormSchema,
  AdminFormEditTestimonialData,
} from "./schema";
import {
  createTestimonial,
  deleteTestimonialById,
  updateTestimonialById,
} from "@/lib/server/actions";
import { usePreviewUrl } from "@/hooks";

type AdminTestimonialsFormProps = {
  isEditMode?: boolean;
  testimonialData?: Testimonial;
};

export function AdminTestimonialsForm(props: AdminTestimonialsFormProps) {
  const { isEditMode = false, testimonialData } = props;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionLocked, setIsActionLocked] = useState(false);

  const preview = usePreviewUrl(file);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminTestimonialsFormData>({
    resolver: zodResolver(AdminTestimonialsFormSchema(isEditMode)),
    defaultValues: {
      name: testimonialData?.name ?? "",
      text: testimonialData?.text ?? "",
      rating: testimonialData?.rating ?? 5,
      isActive: testimonialData?.isActive ?? true,
      sortOrder: testimonialData?.sortOrder ?? 0,
    },
  });

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
      maxSizeMB: 0.25,
      maxWidthOrHeight: 400,
      useWebWorker: true,
    });
    if (compressedFile.size > 1 * 1024 * 1024) {
      toast.error("Error compressing image. Please choose a smaller file.");
      clearFileInput();
      return;
    }
    setValue("image", compressedFile, { shouldValidate: true });
    setFile(compressedFile);
  };

  const onAddSubmit = async (data: AdminTestimonialsFormData) => {
    setIsActionLocked(true);
    const addRes = await createTestimonial(data);
    if (!addRes.success) {
      setIsActionLocked(false);
      toast.error("Error creating testimonial");
      return;
    }
    toast.success("Testimonial created successfully!");
    router.back();
  };

  const onEditSubmit = async (data: AdminFormEditTestimonialData) => {
    setIsActionLocked(true);
    const editRes = await updateTestimonialById(
      testimonialData?.id || "",
      data,
    );
    if (!editRes.success) {
      setIsActionLocked(false);
      toast.error("Error updating testimonial");
      return;
    }
    toast.success("Testimonial updated successfully!");
    router.back();
  };

  const onDelete = async () => {
    if (!testimonialData?.id) return;
    setIsDeleting(true);
    setIsActionLocked(true);
    const res = await deleteTestimonialById(testimonialData?.id);
    if (!res.success) {
      setIsDeleting(false);
      setIsActionLocked(false);
      toast.error("Error deleting testimonial");
      return;
    }
    toast.success("Testimonial deleted successfully!");
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
                ? "Edit the testimonial details below."
                : "Fill in details for the new testimonial below."}
            </AdminFieldDescription>
            <AdminFieldGroup>
              <AdminField>
                <AdminFieldLabel htmlFor="name">
                  Reviewer Name
                </AdminFieldLabel>
                <AdminInput id="name" {...register("name")} />
                <AdminFieldError errors={[errors.name]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="text">Review Text</AdminFieldLabel>
                <textarea
                  id="text"
                  {...register("text")}
                  className="flex w-full rounded-md border border-neutral-04 bg-white px-3 py-2 text-sm placeholder:text-neutral-08 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-06 min-h-[100px]"
                />
                <AdminFieldError errors={[errors.text]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="rating">
                  Rating (1-5)
                </AdminFieldLabel>
                <AdminInput
                  id="rating"
                  type="number"
                  min={1}
                  max={5}
                  {...register("rating", { valueAsNumber: true })}
                />
                <AdminFieldError errors={[errors.rating]} />
              </AdminField>
              <AdminField>
                <AdminFieldLabel htmlFor="isActive">Active</AdminFieldLabel>
                <input
                  id="isActive"
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4"
                />
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
                  Reviewer Photo (optional)
                </AdminFieldLabel>
                <AdminInput
                  id="image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <AdminFieldError errors={[errors.image]} />
                {(preview || testimonialData?.imageSrc) && (
                  <div className="relative w-20 h-20 mt-2">
                    <Image
                      src={preview || testimonialData?.imageSrc || ""}
                      alt="Preview"
                      fill
                      priority
                      sizes="80px"
                      className="rounded-full object-cover"
                    />
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
                    : "Create Testimonial"}
              </AdminButton>
              {isEditMode && (
                <AdminButton
                  type="button"
                  onClick={onDelete}
                  disabled={isBusy}
                  variant="outline"
                  className="flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete Testimonial"}
                </AdminButton>
              )}
            </div>
          </AdminFieldSet>
        </AdminFieldGroup>
      </form>
    </div>
  );
}
