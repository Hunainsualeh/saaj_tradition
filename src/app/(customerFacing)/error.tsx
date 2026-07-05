"use client";

import { useEffect } from "react";
import Link from "next/link";

import { routes } from "@/lib";

/**
 * Error boundary for the customer-facing segment. The (customerFacing) layout
 * (Navbar + Footer) stays mounted; only the page content is replaced, so the
 * user keeps navigation and can retry or leave gracefully.
 */
export default function CustomerFacingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console / any error-tracking hook.
    console.error("[CustomerFacing] Unhandled error:", error);
  }, [error]);

  return (
    <main className="flex items-center my-16 justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-semibold text-neutral-11 mb-4">
          Something went wrong
        </h1>
        <p className="text-lg text-neutral-09 mb-8 max-w-md mx-auto">
          We hit an unexpected error. Please try again — if it keeps happening,
          come back in a little while.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-07 mb-6">Reference: {error.digest}</p>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="rounded-sm bg-neutral-11 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-12"
          >
            Try again
          </button>
          <Link
            href={routes.home}
            className="rounded-sm border border-neutral-03 px-6 py-3 text-sm font-medium text-neutral-11 transition-colors hover:bg-neutral-02"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
