import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TRANSITION_DURATION_MS } from "../lib/spritePositioning";

interface VersusBannerProps {
  leftName?: string;
  rightName?: string;
  variant?: "intro" | "compact" | "hidden";
  preset?: "snappy" | "balanced" | "cinematic";
  holdMs?: number; // how long to hold fully visible before fading
  fadeMs?: number; // fade duration in ms
  onHidden?: () => void;
}

export function VersusBanner({
  leftName = "",
  rightName = "",
  variant = "intro",
  preset = "balanced",
  holdMs,
  fadeMs,
  onHidden,
}: VersusBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (variant === "hidden") return;

    // Respect reduced motion by skipping animation timers
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Immediately hide after short timeout
      const t = setTimeout(() => {
        setVisible(false);
        onHidden?.();
      }, 200);
      return () => clearTimeout(t);
    }

    // Resolve preset defaults if explicit timings are not provided
    let finalHold: number;
    let finalFade: number;
    if (typeof holdMs === "number" && typeof fadeMs === "number") {
      finalHold = holdMs;
      finalFade = fadeMs;
    } else {
      switch (preset) {
        case "snappy":
          finalHold = 600;
          finalFade = 200;
          break;
        case "cinematic":
          finalHold = TRANSITION_DURATION_MS + 600;
          finalFade = 350;
          break;
        default:
          finalHold = TRANSITION_DURATION_MS + 200;
          finalFade = 300;
      }
    }

    // Normal flow: hold then fade
    const holdTimer = setTimeout(() => setVisible(false), finalHold);
    const doneTimer = setTimeout(() => {
      onHidden?.();
    }, finalHold + finalFade);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [variant, preset, holdMs, fadeMs, onHidden]);

  if (variant === "hidden") return null;

  const isIntro = variant === "intro";
  const wrapperClass = isIntro
    ? "absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
    : "absolute top-6 left-6 z-30 pointer-events-none";

  const leftTextClass = isIntro
    ? "text-2xl md:text-3xl font-bold"
    : "text-sm font-bold";
  const rightTextClass = leftTextClass;
  const vsClass = isIntro
    ? "text-6xl md:text-8xl font-black tracking-widest"
    : "text-base font-black";

  return (
    <motion.div
      className={wrapperClass}
      initial={{ opacity: 0, scale: isIntro ? 0.9 : 1 }}
      animate={
        visible
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: isIntro ? 1.05 : 1 }
      }
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-hidden
    >
      <div className="flex items-center gap-6 text-center text-white drop-shadow-lg select-none">
        <div className={leftTextClass} style={{ opacity: 0.95 }}>
          {leftName}
        </div>
        <div className={vsClass}>VS</div>
        <div className={rightTextClass} style={{ opacity: 0.95 }}>
          {rightName}
        </div>
      </div>
    </motion.div>
  );
}
