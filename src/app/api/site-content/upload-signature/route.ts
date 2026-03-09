import { NextRequest, NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";

const ADMIN_COOKIE_NAME = "admin_session";

const ALLOWED_RESOURCE_TYPES = new Set(["image", "video"]);

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

/*
  Returns a Cloudinary signed upload signature so the browser can upload
  files (images up to 50 MB, videos up to 200 MB) directly to Cloudinary
  without passing through Vercel's 4.5 MB serverless payload limit.

  GET /api/site-content/upload-signature?resourceType=image|video&folder=site-content
  → { signature, timestamp, apiKey, cloudName, folder }
*/
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folder = "site-content";
  const resourceType = searchParams.get("resourceType") ?? "image";

  if (!ALLOWED_RESOURCE_TYPES.has(resourceType)) {
    return NextResponse.json(
      { error: "Invalid resource type. Must be image or video." },
      { status: 400 },
    );
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";

  if (!apiSecret || !apiKey || !cloudName) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on the server." },
      { status: 500 },
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { folder, timestamp };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}
