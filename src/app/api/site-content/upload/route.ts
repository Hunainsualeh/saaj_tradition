import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ADMIN_COOKIE_NAME = "admin_session";

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

function isAdminAuthenticated(req: NextRequest): boolean {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`),
  );
  const token = match?.[1];
  if (!token) return false;
  try {
    const decoded = JSON.parse(
      Buffer.from(decodeURIComponent(token), "base64").toString("utf-8"),
    );
    return Boolean(decoded.id && decoded.role);
  } catch {
    return false;
  }
}

/**
 * POST /api/site-content/upload
 * Uploads a single image or video for the site-content section.
 * FormData field: "file"
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
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
      ...(isImage && {
        transformation: [{ width: 3840, height: 2160, crop: "limit" }],
        quality: "auto:best",
        fetch_format: "auto",
      }),
    });

    const url = isVideo
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
