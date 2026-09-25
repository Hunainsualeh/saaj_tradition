import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib";

type CollectionTileProps = {
  href: string;
  imageUrl: string;
  title: string;
  description: string;
  headingLevel?: "h2" | "h3";
};

export function CollectionTile(props: CollectionTileProps) {
  // === PROPS ===
  const { href, title, description, imageUrl, headingLevel = "h3" } = props;
  const Heading = headingLevel;

  return (
    <Link href={href} className="group block w-full">
      <Heading className="sr-only">{title}</Heading>
      <div className="relative aspect-4/3 overflow-hidden rounded-sm xl:flex">
        <Image
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          src={imageUrl}
          alt={title}
        />

        {/* Over XL Viewport */}
        <div
          className={cn(
            "hidden xl:flex xl:opacity-0 xl:group-hover:opacity-100",
            "absolute inset-0 rounded-sm",
            "bg-black/50 backdrop-blur-sm",
            "flex-col items-center justify-center text-center text-white p-6",
            "transition-opacity duration-300 ease-in-out",
          )}
        >
          <p aria-hidden="true" className="mb-2 text-4xl font-semibold">{title}</p>
          <p className="text-sm text-neutral-01 max-w-xs">{description}</p>
        </div>

        {/* Under XL Viewport */}
        <div
          className={cn(
            "xl:hidden",
            "absolute inset-0 rounded-sm",
            "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.6)_100%)]",
          )}
        />

        <div className="xl:hidden absolute bottom-0 left-0 right-0 p-6 text-white">
          <p aria-hidden="true" className="mb-2 text-xl">{title}</p>
          <p className="text-base text-neutral-03">{description}</p>
        </div>
      </div>
    </Link>
  );
}
