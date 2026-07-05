"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary for the admin segment. Keeps the admin shell usable when a
 * page or data fetch throws (e.g. a transient DB error) instead of showing a
 * blank screen.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-neutral-600">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        {error.digest && (
          <p className="mb-6 text-xs text-neutral-400">Reference: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Retry
          </button>
          <Link
            href="/admin"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
