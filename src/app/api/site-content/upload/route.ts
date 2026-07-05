import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminFromRequest } from "@/lib/server/helpers/require-admin";

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// SVG intentionally excluded: SVGs can embed <script>/onload handlers, so we
// only accept raster formats here (matches the product uploader). Vector logos
// should be supplied as PNG/WebP or referenced by external URL.
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

/**
 * POST /api/site-content/upload
 * Uploads a single image or video for the site-content section.
 * FormData field: "file"
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminFromRequest(req.headers.get("cookie") ?? "");
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
    // SVG is a vector — skip raster resizing/format conversion so it stays crisp.
    const isSvg = file.type === "image/svg+xml";

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }

    const maxSize = isVideo ? 200 * 1024 * 1024 : 50 * 1024 * 1024; // 200MB video, 50MB image
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max: ${isVideo ? "200MB" : "50MB"}` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-z0-9._-]/gi, "_").replace(/\.[^.]+$/, "");
    const publicId = `saaj/site-content/${Date.now()}-${sanitizedName}`;
    const mimeBase64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(mimeBase64, {
      public_id: publicId,
      resource_type: isVideo ? "video" : "image",
      overwrite: true,
      ...(isImage &&
        !isSvg && {
          transformation: [{ width: 3840, height: 2160, crop: "limit" }],
          quality: "auto:best",
          fetch_format: "auto",
        }),
    });

    const url =
      isVideo || isSvg
        ? result.secure_url
        : cloudinary.url(result.public_id, {
            secure: true,
            quality: "auto:best",
            fetch_format: "auto",
          });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Site-content upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
