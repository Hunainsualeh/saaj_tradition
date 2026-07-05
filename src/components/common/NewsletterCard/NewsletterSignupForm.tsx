"use client";

import { useActionState } from "react";

import { Button, Input } from "@/components/ui";
import { subscribeToNewsletter } from "@/lib/server/actions/newsletter-actions";

export function NewsletterSignupForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    null,
  );

  if (state?.success) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-green-200 bg-green-50 px-4 py-3">
        <svg
          className="h-5 w-5 shrink-0 text-green-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm font-medium text-green-800">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col w-full gap-2">
      <div className="flex flex-col md:flex-row w-full gap-2">
        <Input
          className="flex-1 w-full md:w-auto"
          variant="light"
          id="newsletter"
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          isError={Boolean(state && !state.success)}
          aria-label="Email address"
        />
        <Button
          className="w-full md:w-auto"
          variant="light"
          type="submit"
          isLoading={isPending}
          text="Sign up to newsletter"
        />
      </div>
      {state && !state.success && state.message && (
        <p className="text-sm text-red-600 pl-1">{state.message}</p>
      )}
    </form>
  );
}
