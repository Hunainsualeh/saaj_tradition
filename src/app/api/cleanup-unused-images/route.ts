import { prisma } from "@/lib/prisma";
import { cleanupUnusedCloudinaryImages } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

/*

    This CRON job cleans up unused images from Cloudinary for all resources:
    - Author avatars
    - Blog images
    - Product images
    
    Note: Cloudinary images are automatically optimized and served via CDN.
    This endpoint tracks used images and reports on any unused assets.

*/

function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = {
      authors: { deleted: 0, errors: 0 },
      blogs: { deleted: 0, errors: 0 },
      products: { deleted: 0, errors: 0 },
    };

    // Clean up author images
    try {
      const authors = await prisma.author.findMany({
        select: { avatarUrl: true },
      });

      const validAuthorUrls = new Set(authors.map((a) => a.avatarUrl));

      const authorResult = await cleanupUnusedCloudinaryImages({
        folder: "authors",
        validUrls: validAuthorUrls,
        resourceName: "author",
      });

      const authorData = await authorResult.json();
      results.authors = authorData;
    } catch (error) {
      console.error("Error cleaning up author images:", error);
      results.authors.errors = 1;
    }

    // Clean up blog images
    try {
      const blogs = await prisma.blogPost.findMany({
        select: { blogImageUrl: true },
      });

      const validBlogUrls = new Set(blogs.map((b) => b.blogImageUrl));

      const blogResult = await cleanupUnusedCloudinaryImages({
        folder: "blogs",
        validUrls: validBlogUrls,
        resourceName: "blog",
      });

      const blogData = await blogResult.json();
      results.blogs = blogData;
    } catch (error) {
      console.error("Error cleaning up blog images:", error);
      results.blogs.errors = 1;
    }

    // Clean up product images
    try {
      const products = await prisma.product.findMany({
        select: { images: true },
      });

      const validProductUrls = new Set(products.flatMap((p) => p.images));

      const productResult = await cleanupUnusedCloudinaryImages({
        folder: "products",
        validUrls: validProductUrls,
        resourceName: "product",
      });

      const productData = await productResult.json();
      results.products = productData;
    } catch (error) {
      console.error("Error cleaning up product images:", error);
      results.products.errors = 1;
    }

    const totalDeleted =
      results.authors.deleted +
      results.blogs.deleted +
      results.products.deleted;
    const totalErrors =
      results.authors.errors + results.blogs.errors + results.products.errors;

    return NextResponse.json(
      {
        success: true,
        message: `Cleanup complete. Total deleted: ${totalDeleted}, Total errors: ${totalErrors}`,
        details: results,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Cleanup job failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Cleanup job failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
