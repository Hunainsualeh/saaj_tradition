import { uploadMultipleToCloudinary } from "@/lib/server/helpers/cloudinary-upload";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
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
 * API route to upload product images to Cloudinary
 * Requires an active admin session
 * Images are automatically optimized and delivered via CDN
 */
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const entries = form.getAll("files");
    const files = entries.filter((v): v is File => v instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    // Validate file types
    const invalidFile = files.find((f) => !ALLOWED_MIME_TYPES.has(f.type));
    if (invalidFile) {
      return NextResponse.json(
        { error: `Invalid file type: ${invalidFile.type}. Only images are allowed.` },
        { status: 400 },
      );
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFile = files.find((f) => f.size > maxSize);
    if (oversizedFile) {
      return NextResponse.json(
        { error: `File too large: ${oversizedFile.name}. Max size is 10MB.` },
        { status: 400 },
      );
    }

    // Upload to Cloudinary with automatic optimization
    const urls = await uploadMultipleToCloudinary(files, "products");

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 },
    );
  }
}
