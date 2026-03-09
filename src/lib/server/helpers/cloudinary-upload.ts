import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type CloudinaryUploadFolder = 
  | "products"
  | "categories"
  | "blogs"
  | "authors"
  | "team"
  | "testimonials"
  | "collections"
  | "site-content";

/**
 * Upload image to Cloudinary with optimization
 * @param fileBuffer File buffer or data URI
 * @param fileName Original file name for reference
 * @param folder Cloudinary folder for organization
 * @param options Additional upload options
 * @returns Optimized image URL from Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer | string,
  fileName: string,
  folder: CloudinaryUploadFolder = "products",
  options?: Record<string, unknown>,
): Promise<string> {
  try {
    // Generate a unique public ID from filename
    const sanitizedName = fileName.replace(/[^a-z0-9._-]/gi, "_").replace(/\.[^.]+$/, "");
    const publicId = `saaj/${folder}/${Date.now()}-${sanitizedName}`;

    // Cloudinary uploader.upload only accepts strings (data URI, URL, or file path)
    // Convert Buffer to base64 data URI
    const uploadSource: string =
      typeof fileBuffer === "string"
        ? fileBuffer
        : `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(uploadSource, {
      public_id: publicId,
      resource_type: "image",
      overwrite: true,
      // Incoming transformation: resize large images before storage
      transformation: [
        {
          width: 2000,
          height: 2000,
          crop: "limit",
        },
      ],
      ...options,
    });

    // Build delivery URL with automatic format (f_auto) and quality (q_auto:good)
    // These are delivery-time transformations served by Cloudinary CDN
    const optimizedUrl = cloudinary.url(result.public_id, {
      secure: true,
      quality: "auto:good",
      fetch_format: "auto",
    });

    return optimizedUrl;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload image to Cloudinary: ${error}`);
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param files Array of File objects
 * @param folder Cloudinary folder
 * @returns Array of optimized image URLs
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: CloudinaryUploadFolder = "products",
): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const buffer = await file.arrayBuffer();
    return uploadToCloudinary(Buffer.from(buffer), file.name, folder);
  });

  return Promise.all(uploadPromises);
}

/**
 * Delete image from Cloudinary
 * @param publicId Cloudinary public ID (path)
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error(`Failed to delete image from Cloudinary: ${error}`);
  }
}

/**
 * Get optimized URL for a Cloudinary image with optional transformations
 * @param publicId Cloudinary public ID
 * @param width Optional width for responsive images
 * @param height Optional height
 */
export function getOptimizedCloudinaryUrl(
  publicId: string,
  width?: number,
  height?: number,
): string {
  const transformations: Record<string, unknown> = {
    quality: "auto:good",
    fetch_format: "auto",
    resource_type: "auto",
  };

  if (width) transformations.width = width;
  if (height) transformations.height = height;

  return cloudinary.url(publicId, transformations);
}
