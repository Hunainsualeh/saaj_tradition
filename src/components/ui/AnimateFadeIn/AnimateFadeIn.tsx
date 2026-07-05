"use client";

import { useInViewOnce } from "@/lib/animations/use-in-view-once";

type AnimateFadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: "short" | "normal" | "long";
  hidden?: boolean;
  noMargin?: boolean;
};

const DURATION_MS: Record<string, number> = {
  short: 150,
  normal: 300,
  long: 700,
};

/**
 * Fade-in-on-scroll wrapper. CSS-transition based (no framer-motion) so it
 * adds zero JS animation cost on the home page's hottest grids.
 */
export function AnimateFadeIn(props: AnimateFadeInProps) {
  const {
    children,
    className = "",
    delay = 0.1,
    duration = "long",
    hidden = false,
    noMargin = false,
  } = props;

  const { ref, inView } = useInViewOnce(noMargin ? "0px" : "-150px");
  const durationMs = DURATION_MS[duration] ?? DURATION_MS.normal;
  const visible = !hidden && inView;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${durationMs}ms ease-in-out`,
        transitionDelay: `${Math.round(delay * 1000)}ms`,
        willChange: "opacity",
      }}
    >
      {children}
    </div>
  );
}
