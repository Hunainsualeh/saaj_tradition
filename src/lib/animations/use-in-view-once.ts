"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight, dependency-free replacement for framer-motion's `useInView`.
 * Fires once when the element scrolls into view, then disconnects.
 * Falls back to "visible" when IntersectionObserver is unavailable (SSR/old).
 */
export function useInViewOnce(rootMargin = "-150px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IntersectionObserver (very old browser / test env): reveal
      // immediately. Deferred to a microtask so it isn't a synchronous setState
      // in the effect body (which would trigger a cascading render).
      queueMicrotask(() => setInView(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
