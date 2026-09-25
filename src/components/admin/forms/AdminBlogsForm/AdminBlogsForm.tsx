"use client";

import { useRef, useState } from "react";
import type { BlogPost, Author } from "@prisma/client";
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
  AdminSelect,
  AdminSelectContent,
  AdminSelectGroup,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
  AdminTextarea,
} from "@/components/admin";

import { usePreviewUrl } from "@/hooks";
import { adminRoutes } from "@/lib";
import { AdminBlogsFormData, AdminBlogsFormSchema } from "./schema";
import {
  createBlog,
  deleteBlogById,
  updateBlogById,
} from "@/lib/server/actions";
import { BLOG_CATEGORY_OPTIONS } from "./constants";
import { convertStringToBlog } from "@/lib/parsers";

type AdminBlogsFormProps = {
  authorList: Author[];
  isEditMode?: boolean;
  blogData?: BlogPost;
};

export function AdminBlogsForm(props: AdminBlogsFormProps) {
  // === PROPS ===
  const { isEditMode = false, blogData, authorList } = props;

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
    watch,
    formState: { errors },
  } = useForm<AdminBlogsFormData>({
    resolver: zodResolver(AdminBlogsFormSchema(isEditMode)),
    defaultValues: {
      authorId: blogData?.authorId || "",
      category: blogData?.category || "",
      title: blogData?.title || "",
      description: blogData?.description || "",
      slug: blogData?.slug || "",
      content: blogData?.content || "",
    },
  });

  // === WATCHERS ===
  const contentValue = watch("content");
  const authorIdValue = watch("authorId");
  const categoryValue = watch("category");

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
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
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

  const onAddSubmit = async (data: AdminBlogsFormData) => {
    if (!data.image) {
      toast.error("Image is required");
      return;
    }

    setIsActionLocked(true);

    const payload = {
      ...data,
      image: data.image,
    };

    const addRes = await createBlog(payload);

    if (!addRes.success) {
      setIsActionLocked(false);
      toast.error(addRes.error || "Error creating blog");
      return;
    }

    toast.success("Blog created successfully!");
    router.push(adminRoutes.blogs);
  };

  const onEditSubmit = async (data: AdminBlogsFormData) => {
    setIsActionLocked(true);

    const editRes = await updateBlogById(blogData?.id || "", data);

    if (!editRes.success) {
      setIsActionLocked(false);
      toast.error(editRes.error || "Error updating blog");
      return;
    }

    toast.success("Blog updated successfully!");
    router.push(adminRoutes.blogs);
  };

  const onDelete = async () => {
    if (!blogData?.id) return;
    if (!window.confirm("Delete this blog? This action cannot be undone.")) return;

    setIsDeleting(true);
    setIsActionLocked(true);

    const res = await deleteBlogById(blogData?.id);

    if (!res.success) {
      setIsDeleting(false);
      setIsActionLocked(false);
      toast.error(res.error || "Error deleting blog");
      return;
    }

    toast.success("Blog deleted successfully!");
    router.push(adminRoutes.blogs);
  };

  const isBusy = isActionLocked || isDeleting;

  return (
    <div className="w-full">
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
                ? "Edit the blog details below."
                : "Fill in details for the new blog below."}
            </AdminFieldDescription>

            <div className="gap-7 flex-col flex lg:flex-row lg:gap-16">
              <AdminFieldGroup className="lg:max-w-md">
                {/* TITLE */}
                <AdminField>
                  <AdminFieldLabel htmlFor="title">Title</AdminFieldLabel>
                  <AdminInput id="title" {...register("title")} />
                  <AdminFieldError errors={[errors.title]} />
                </AdminField>

                {/* OCCUPATION */}
                <AdminField>
                  <AdminFieldLabel htmlFor="description">
                    Description
                  </AdminFieldLabel>
                  <AdminFieldDescription>
                    One sentence summary of the blog
                  </AdminFieldDescription>
                  <AdminTextarea
                    id="description"
                    {...register("description")}
                  />
                  <AdminFieldError errors={[errors.description]} />
                </AdminField>

                {/* CATEGORY */}
                <AdminField>
                  <AdminFieldLabel htmlFor="category">Category</AdminFieldLabel>
                  <AdminSelect
                    value={categoryValue}
                    onValueChange={(val) =>
                      setValue("category", val, { shouldValidate: true })
                    }
                  >
                    <AdminSelectTrigger id="category" className="w-[180px]">
                      <AdminSelectValue />
                    </AdminSelectTrigger>
                    <AdminSelectContent>
                      <AdminSelectGroup>
                        {BLOG_CATEGORY_OPTIONS.map((category) => (
                          <AdminSelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </AdminSelectItem>
                        ))}
                      </AdminSelectGroup>
                    </AdminSelectContent>
                  </AdminSelect>
                  <AdminFieldError errors={[errors.category]} />
                </AdminField>

                {/* SLUG */}
                <AdminField>
                  <AdminFieldLabel htmlFor="slug">Slug</AdminFieldLabel>
                  <AdminFieldDescription>
                    {'Readable unique identifier for URL (e.g. "my-blog-post")'}
                  </AdminFieldDescription>
                  <AdminInput id="slug" {...register("slug")} />
                  <AdminFieldError errors={[errors.slug]} />
                </AdminField>

                {/* AUTHOR */}
                <AdminField>
                  <AdminFieldLabel htmlFor="authorId">Author</AdminFieldLabel>
                  <AdminSelect
                    value={authorIdValue}
                    onValueChange={(val) =>
                      setValue("authorId", val, { shouldValidate: true })
                    }
                  >
                    <AdminSelectTrigger id="authorId" className="w-[180px]">
                      <AdminSelectValue />
                    </AdminSelectTrigger>
                    <AdminSelectContent>
                      <AdminSelectGroup>
                        {authorList.map((author) => (
                          <AdminSelectItem key={author.id} value={author.id}>
                            {author.name}
                          </AdminSelectItem>
                        ))}
                      </AdminSelectGroup>
                    </AdminSelectContent>
                  </AdminSelect>
                  <AdminFieldError errors={[errors.authorId]} />
                </AdminField>

                {/* IMAGE */}
                <AdminField>
                  <AdminFieldLabel htmlFor="blogImage">
                    Blog Image
                  </AdminFieldLabel>

                  <AdminInput
                    id="blogImage"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <AdminFieldError errors={[errors.image]} />

                  {(preview || blogData?.blogImageUrl) && (
                    <div className="relative w-60! h-45 mt-2">
                      <Image
                        src={preview || blogData?.blogImageUrl || ""}
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

              {/* CONTENT */}
              <AdminFieldGroup>
                <AdminField>
                  <AdminFieldLabel htmlFor="content">Content</AdminFieldLabel>
                  <AdminFieldDescription>For title use #</AdminFieldDescription>
                  <AdminFieldDescription>
                    For new line use /n
                  </AdminFieldDescription>
                  <AdminTextarea
                    id="content"
                    rows={10}
                    {...register("content")}
                  />
                  <AdminFieldError errors={[errors.content]} />
                </AdminField>

                {/* PREVIEW */}
                <AdminFieldDescription>Preview:</AdminFieldDescription>
                <div className="border min-h-20 rounded-lg px-3 py-2 h-full overflow-auto">
                  {convertStringToBlog(contentValue, true)}
                </div>
              </AdminFieldGroup>
            </div>

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
                    : "Create Blog"}
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
                  {isDeleting ? "Deleting..." : "Delete Blog"}
                </AdminButton>
              )}
            </div>
          </AdminFieldSet>
        </AdminFieldGroup>
      </form>
    </div>
  );
}
