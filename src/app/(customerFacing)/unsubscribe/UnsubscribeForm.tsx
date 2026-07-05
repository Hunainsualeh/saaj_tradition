"use client";

import { useState, useTransition } from "react";
import { unsubscribeFromNewsletter } from "@/lib/server/actions/email-actions";

type Props = { prefillEmail?: string };

export function UnsubscribeForm({ prefillEmail }: Props) {
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await unsubscribeFromNewsletter(email);
      if (result.success) {
        setStatus("success");
        setMessage("You have been unsubscribed. You will no longer receive emails from us.");
      } else {
        setStatus("error");
        setMessage(result.error ?? "Something went wrong. Please try again.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-6 text-green-800 text-sm">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full border border-neutral-03 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-12"
        disabled={isPending}
      />
      {status === "error" && (
        <p className="text-red-600 text-xs text-left">{message}</p>
      )}
      <button
        type="submit"
        disabled={isPending || !email}
        className="w-full bg-neutral-12 text-white rounded-md px-6 py-3 text-sm font-medium hover:bg-neutral-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Processing…" : "Unsubscribe"}
      </button>
    </form>
  );
}
