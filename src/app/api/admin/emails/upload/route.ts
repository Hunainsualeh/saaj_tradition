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

// SVG intentionally excluded — see src/app/api/site-content/upload/route.ts.
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/admin/emails/upload
 * Uploads a single image for use in broadcast newsletter / product / collection
 * emails. FormData field: "file". Returns: { url: string }
 *
 * Images are capped at 1600px (2x a typical ~800px email column — plenty for
 * retina displays without bloating message size) and compressed with
 * quality:auto:good. Format is left as the original upload (no f_auto/WebP):
 * some email clients (notably Outlook's Word rendering engine) can't display
 * WebP/AVIF, and a broken CTA image is worse than a slightly larger JPEG/PNG.
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

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max: 10MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-z0-9._-]/gi, "_").replace(/\.[^.]+$/, "");
    const publicId = `saaj/broadcast/${Date.now()}-${sanitizedName}`;
    const mimeBase64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(mimeBase64, {
      public_id: publicId,
      resource_type: "image",
      overwrite: true,
      transformation: [{ width: 1600, height: 1600, crop: "limit" }],
      quality: "auto:good",
    });

    const url = cloudinary.url(result.public_id, {
      secure: true,
      quality: "auto:good",
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Broadcast email upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
