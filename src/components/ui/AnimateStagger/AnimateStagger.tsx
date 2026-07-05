"use client";

import { Children } from "react";

import { useInViewOnce } from "@/lib/animations/use-in-view-once";

type AnimateStaggerProps = {
  children?: React.ReactNode;
  className?: string;
  childClassName?: string;
  staggerDelay?: number;
  duration?: "short" | "normal" | "long";
  disableIsInView?: boolean;
};

const DURATION_MS: Record<string, number> = {
  short: 150,
  normal: 300,
  long: 700,
};

/**
 * Staggered fade/slide-up of children on scroll-in. CSS-transition based
 * (no framer-motion): each child gets an incremental transition-delay.
 * The slide distance is read from the `--animate-y` CSS variable (default 200px).
 */
export function AnimateStagger(props: AnimateStaggerProps) {
  const {
    children,
    className = "",
    childClassName = "",
    staggerDelay = 0.1,
    duration = "normal",
    disableIsInView = false,
  } = props;

  const { ref, inView } = useInViewOnce("-150px");
  const visible = disableIsInView || inView;
  const durationMs = DURATION_MS[duration] ?? DURATION_MS.normal;

  const items = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, index) => (
        <div
          key={index}
          className={childClassName}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateY(0)"
              : "translateY(var(--animate-y, 200px))",
            transition: `opacity ${durationMs}ms ease-in-out, transform ${durationMs}ms ease-in-out`,
            transitionDelay: visible
              ? `${Math.round(index * staggerDelay * 1000)}ms`
              : "0ms",
            willChange: "opacity, transform",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
