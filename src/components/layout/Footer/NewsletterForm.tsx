"use client";

import { useActionState, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToNewsletter } from "@/lib/server/actions/newsletter-actions";

// Fixed confetti burst positions (avoids SSR randomness issues)
const CONFETTI = [
  { id: 0, x: -90,  y: -80,  rotate: 30,   color: "#c9a84c", w: 7, h: 5  },
  { id: 1, x: 90,   y: -90,  rotate: -20,  color: "#e8e0d5", w: 5, h: 7  },
  { id: 2, x: -120, y: -50,  rotate: 60,   color: "#c9a84c", w: 6, h: 4  },
  { id: 3, x: 120,  y: -60,  rotate: -50,  color: "#fff",    w: 4, h: 6  },
  { id: 4, x: -40,  y: -120, rotate: 15,   color: "#b8960c", w: 8, h: 4  },
  { id: 5, x: 50,   y: -130, rotate: -35,  color: "#e8e0d5", w: 5, h: 5  },
  { id: 6, x: -100, y: -110, rotate: 55,   color: "#c9a84c", w: 6, h: 6  },
  { id: 7, x: 100,  y: -40,  rotate: -10,  color: "#fff",    w: 7, h: 3  },
  { id: 8, x: -60,  y: -140, rotate: 75,   color: "#b8960c", w: 5, h: 7  },
  { id: 9, x: 70,   y: -110, rotate: -65,  color: "#c9a84c", w: 6, h: 4  },
  { id: 10, x: -150, y: -70, rotate: 20,   color: "#e8e0d5", w: 4, h: 6  },
  { id: 11, x: 150,  y: -80, rotate: -45,  color: "#c9a84c", w: 7, h: 5  },
  { id: 12, x: 20,   y: -150, rotate: 40,  color: "#fff",    w: 5, h: 5  },
  { id: 13, x: -20,  y: -100, rotate: -80, color: "#b8960c", w: 6, h: 3  },
];

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    null,
  );

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!state?.success) return;
    const tOn = setTimeout(() => setShowConfetti(true), 0);
    const tOff = setTimeout(() => setShowConfetti(false), 2000);
    return () => {
      clearTimeout(tOn);
      clearTimeout(tOff);
    };
  }, [state]);

  if (state?.success) {
    return (
      <div className="relative flex flex-col items-center justify-center py-6 gap-3">
        {/* Confetti burst */}
        <AnimatePresence>
          {showConfetti &&
            CONFETTI.map((p) => (
              <motion.span
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: 0,
                  rotate: p.rotate,
                  scale: 0.4,
                }}
                transition={{ duration: 1.4, ease: [0.2, 0.8, 0.4, 1] }}
                className="absolute top-1/2 left-1/2 rounded-sm pointer-events-none"
                style={{
                  width: p.w,
                  height: p.h,
                  backgroundColor: p.color,
                  marginLeft: -p.w / 2,
                  marginTop: -p.h / 2,
                }}
              />
            ))}
        </AnimatePresence>

        {/* Success state */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#c9a84c]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-800 font-medium tracking-wide">
              You&apos;re on the list.
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Exclusive updates coming your way.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <div className="flex h-11 rounded-full overflow-hidden border border-gray-300 bg-white focus-within:border-amber-400 transition-colors duration-200 shadow-sm">
        <input
          id="newsletter"
          name="email"
          type="email"
          placeholder="Your email address"
          required
          className="flex-1 min-w-0 bg-transparent pl-4 pr-2 text-[13px] text-gray-800 placeholder:text-gray-400 outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 h-full px-5 bg-[#c9a84c] text-white text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-[#b8960c] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "…" : "Subscribe"}
        </button>
      </div>

      {state?.message && !state.success && (
        <p className="text-xs mt-2 text-red-500 pl-3">
          {state.message}
        </p>
      )}
    </form>
  );
}

