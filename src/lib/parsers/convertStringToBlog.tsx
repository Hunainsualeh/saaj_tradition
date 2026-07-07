import { cn } from "@/lib";
import { ReactNode } from "react";

export function convertStringToBlog(
  blogString: string,
  isAdminPreview: boolean = false,
): ReactNode {
  if (!blogString?.trim()) return <></>;

  return blogString.split("\n").map((line, index) => {
    // Blank source lines only separate paragraphs; the paragraph margins below
    // handle that spacing, so we skip them instead of rendering empty <p> tags
    // that leave large, uneven gaps down the article.
    if (!line.trim()) return null;

    if (line.startsWith("# ")) {
      return (
        <h3
          key={index}
          className={cn(
            isAdminPreview
              ? "text-base font-bold mb-2"
              : "text-xl xl:text-2xl font-semibold text-neutral-11 mt-10 mb-4 first:mt-0",
          )}
        >
          {line.replace("# ", "")}
        </h3>
      );
    }

    return (
      <p
        key={index}
        className={cn(
          isAdminPreview
            ? "text-sm mb-4"
            : "text-lg leading-8 tracking-normal text-neutral-11 mb-6 last:mb-0",
        )}
      >
        {line}
      </p>
    );
  });
}
