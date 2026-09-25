"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib";
import { useInViewOnce } from "@/lib/animations/use-in-view-once";

type HeadingTag = "h1" | "h2" | "h3" | "p";

type AnimatedHeadingTextProps = {
  className?: string;
  text: string;
  variant?:
    | "home-screen"
    | "page-title"
    | "sub-page-title"
    | "product-page-title";
  as?: HeadingTag;
  disableIsInView?: boolean;
};

const staggerValueMap: Record<string, number> = {
  "home-screen": 0.03,
  "product-page-title": 0.03,
  "sub-page-title": 0.03,
  "page-title": 0.01,
};

export function AnimatedHeadingText({
  text,
  variant = "page-title",
  className = "",
  as,
  disableIsInView = false,
}: AnimatedHeadingTextProps) {
  const Tag: HeadingTag =
    as ?? (variant === "page-title" || variant === "sub-page-title" ? "h1" : "h2");
  const { ref, inView } = useInViewOnce<HTMLSpanElement>("-150px");
  const visible = disableIsInView || inView;
  const stagger = staggerValueMap[variant] ?? 0.03;

  const words = text.split(" ");
  let letterIndex = 0;

  return (
    <Tag
      className={cn(
        className,
        variant === "product-page-title" &&
          "font-medium text-2xl md:text-3xl xl:text-4xl",
        variant === "page-title" &&
          "text-4xl sm:text-5xl xl:text-7xl lg:text-6xl",
        variant === "home-screen" && "text-4xl! md:text-5xl! xl:text-6xl",
        variant === "sub-page-title" && "text-2xl md:text-3xl lg:text-4xl",
      )}
    >
      <span className="sr-only">{text}</span>
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("saaj-letters", visible && "is-visible")}
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {word.split("").map((char, charIndex) => {
              const style = {
                animationDelay: `${(letterIndex++ * stagger).toFixed(2)}s`,
              } as CSSProperties;
              return (
                <span
                  key={`${wordIndex}-${charIndex}`}
                  className="saaj-letter"
                  style={style}
                >
                  {char}
                </span>
              );
            })}
            {wordIndex < words.length - 1 && " "}
          </span>
        ))}
      </span>
    </Tag>
  );
}
