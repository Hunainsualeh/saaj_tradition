import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/icons";
import { cn } from "@/lib";

export type ExploreLink = {
  label: string;
  href: string;
  description?: string;
};

type ExploreLinksProps = {
  heading: string;
  intro?: string;
  links: ExploreLink[];
  className?: string;
};

export function ExploreLinks({ heading, intro, links, className }: ExploreLinksProps) {
  if (links.length === 0) return null;

  return (
    <nav aria-label={heading} className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2 max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-medium">{heading}</h2>
        {intro && <p className="text-base text-neutral-10">{intro}</p>}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex h-full items-start justify-between gap-4 rounded-sm border border-neutral-03 bg-white p-5 transition-colors hover:border-neutral-09"
            >
              <span className="flex flex-col gap-1">
                <span className="text-base font-medium text-neutral-12">{link.label}</span>
                {link.description && (
                  <span className="text-sm text-neutral-10">{link.description}</span>
                )}
              </span>
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-neutral-10 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              >
                <ArrowUpRightIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
