// DEPRECATED: This file is no longer used. All Vercel Blob storage has been migrated to Cloudinary.
// Use cleanup-unused-cloudinary-images.ts instead.
// This file is kept for historical reference only.

import { list, del } from "@vercel/blob";

type CleanupOptions = {
  prefix: string;
  validUrls: Set<string>;
  resourceName: string;
};

/*

    Cleans up unused blobs from Vercel Blob Storage.
    [DEPRECATED - Vercel Blob has been replaced with Cloudinary]
        - prefix: The blob storage prefix to clean up.
        - validUrls: A set of URLs that are still in use.
        - resourceName: A name for the resource type (for logging purposes).

*/

export async function cleanupUnusedBlobs(options: CleanupOptions) {
  const { prefix, validUrls, resourceName } = options;

  try {
    // Get all blobs from storage with the given prefix
    const items = await list({ prefix });

    let deletedCount = 0;

    // Delete unused blobs
    for (const blob of items.blobs) {
      if (!validUrls.has(blob.url)) {
        await del(blob.pathname);
        deletedCount++;
      }
    }

    return Response.json({
      success: true,
      deletedCount,
      totalBlobs: items.blobs.length,
      resourceName,
    });
  } catch (error) {
    console.error(`Error cleaning up ${resourceName} images:`, error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        resourceName,
      },
      { status: 500 },
    );
  }
}
