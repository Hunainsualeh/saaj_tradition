import Link from "next/link";

import { BlogTileImage } from "./BlogTileImage";

export type BlogTileProps = {
  className?: string;
  href: string;
  title: string;
  description: string;
  imageUrl: string;
  alt: string;
  category: string;
  isBlogPage?: boolean;
  priority?: boolean;
};

export function BlogTile(props: BlogTileProps) {
  // === PROPS ===
  const {
    className = "",
    href,
    title,
    description,
    imageUrl,
    alt,
    category,
    isBlogPage = false,
    priority = false,
  } = props;

  return (
    <Link
      href={href}
      className={`${isBlogPage ? "flex flex-col group gap-6 pb-10" : "flex flex-col md:flex-row group gap-6 md:h-[200px]"} ${className}`}
    >
      <div className={isBlogPage ? "w-full" : "h-full"}>
        <BlogTileImage
          sizes={
            isBlogPage
              ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              : "(max-width: 1200px) 50vw, 25vw"
          }
          isBlogPage={isBlogPage}
          imageUrl={imageUrl}
          alt={alt}
          category={category}
          priority={priority}
        />
      </div>
      <div
        className={
          isBlogPage ? "flex flex-col gap-3" : "flex flex-col gap-3 md:gap-6"
        }
      >
        <h3 className="text-lg xl:text-xl">{title}</h3>
        <p className="text-neutral-10 text-base">{description}</p>
      </div>
    </Link>
  );
}
