import type { Metadata } from "next";
import { UnsubscribeForm } from "./UnsubscribeForm";
import { BaseSection } from "@/components";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main>
      <BaseSection id="unsubscribe-section" className="py-20 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 text-center">
          <h1 className="text-2xl font-medium">Unsubscribe</h1>
          <p className="text-neutral-10 text-sm">
            Enter your email address below to unsubscribe from our newsletter. You
            can re-subscribe at any time.
          </p>
          <UnsubscribeForm prefillEmail={email} />
        </div>
      </BaseSection>
    </main>
  );
}
