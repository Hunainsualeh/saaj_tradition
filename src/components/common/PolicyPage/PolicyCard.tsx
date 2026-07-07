type PolicyCardProps = {
  /** Uppercase card heading, e.g. "Information We Collect". */
  title: string;
  children: React.ReactNode;
};

/**
 * A single frosted-glass "note" card, styled identically to the cards on the
 * order confirmation page. The body uses arbitrary variants so plain prose,
 * lists, links and <strong> passed as children stay readable without each page
 * having to repeat utility classes.
 */
export function PolicyCard({ title, children }: PolicyCardProps) {
  return (
    <section className="rounded-lg border border-neutral-04 overflow-hidden bg-white/70 backdrop-blur-sm">
      <div className="px-5 py-3 border-b border-neutral-04">
        <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-09">
          {title}
        </h2>
      </div>
      <div
        className={`
          px-5 py-5 text-sm leading-relaxed text-neutral-10 space-y-3
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2
          [&_strong]:font-semibold [&_strong]:text-neutral-11
          [&_a]:font-medium [&_a]:text-neutral-11 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-neutral-09
        `}
      >
        {children}
      </div>
    </section>
  );
}
