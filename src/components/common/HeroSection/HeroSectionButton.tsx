"use client";

import Link from "next/link";
import { useState, useCallback } from "react";

import { ArrowUpRightIcon, getButtonStyles } from "@/components";
import { cn, routes } from "@/lib";

type HeroButtonSectionProps = {
  className?: string;
};

export function HeroSectionButton({ className }: HeroButtonSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(0);
  const [circleWidth, setCircleWidth] = useState(0);

  const buttonRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setButtonWidth(node.offsetWidth);
  }, []);

  const circleRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setCircleWidth(node.offsetWidth);
  }, []);

  return (
    <Link
      href={routes.shop}
      className={cn(className, "flex gap-1 relative cursor-pointer")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div
        ref={buttonRef}
        className="z-20 transition-transform duration-300 ease-in-out motion-reduce:transition-none"
        style={{ transform: `translateX(${isHovered ? circleWidth + 4 : 0}px)` }}
      >
        <div className={getButtonStyles("light-no-border")}>Shop now</div>
      </div>

      <div
        ref={circleRef}
        className="bg-white text-black flex items-center justify-center rounded-full w-12 h-12 min-w-12 min-h-12 shrink-0 z-10 transition-transform duration-300 ease-in-out motion-reduce:transition-none"
        style={{ transform: `translateX(${isHovered ? -(buttonWidth + 4) : 0}px)` }}
        aria-hidden="true"
      >
        <ArrowUpRightIcon />
      </div>
    </Link>
  );
}
