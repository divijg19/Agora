import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { FighterDef } from "../types/fighter";

interface FighterSpriteProps {
  fighter: FighterDef;
  isActive: boolean;
  facing: "left" | "right";
  hp: number;
  currentIntent?: string | null;
  isIntroPlaying: boolean;
  isBeingAttacked?: boolean;
}

export function FighterSprite({
  fighter,
  isActive,
  facing,
  hp,
  currentIntent,
  isIntroPlaying,
  isBeingAttacked = false,
}: FighterSpriteProps) {
  const [isStunned, setIsStunned] = useState(false);
  const [showCallout, setShowCallout] = useState(false);

  useEffect(() => {
    if (isBeingAttacked) {
      setIsStunned(true);
      const timer = setTimeout(() => setIsStunned(false), 800);
      return () => clearTimeout(timer);
    }

    setIsStunned(false);
  }, [isBeingAttacked]);

  useEffect(() => {
    if (
      isActive &&
      (currentIntent === "counter" || currentIntent === "rebuttal")
    ) {
      setShowCallout(true);
      const timer = setTimeout(() => setShowCallout(false), 1500);
      return () => clearTimeout(timer);
    }

    setShowCallout(false);
  }, [isActive, currentIntent]);

  const isAttack =
    isActive && (currentIntent === "counter" || currentIntent === "rebuttal");

  let spriteAnimation = {};
  let spriteTransition = {};

  if (isActive) {
    if (isAttack) {
      spriteAnimation = {
        x: facing === "right" ? [0, 40, 0] : [0, -40, 0],
        y: [0, -10, 0],
        scale: 1.15,
        filter: "brightness(1.5) drop-shadow(0 0 15px rgba(255,255,255,0.5))",
      };
      spriteTransition = { duration: 0.3, ease: "easeOut" };
    } else {
      spriteAnimation = {
        y: [0, -5, 0],
        scale: 1.05,
        filter: "brightness(1.2)",
      };
      spriteTransition = { repeat: Infinity, duration: 1.5, ease: "easeInOut" };
    }
  } else if (isStunned) {
    // The Hit Stun State
    spriteAnimation = {
      x:
        facing === "right"
          ? [-10, 10, -10, 10, -5, 0]
          : [10, -10, 10, -10, 5, 0],
      y: 0,
      scale: 0.95,
      filter: "brightness(0.6) sepia(1) hue-rotate(-50deg) saturate(5)",
    };
    spriteTransition = { duration: 0.4, ease: "linear" };
  } else {
    spriteAnimation = {
      x: 0,
      y: 0,
      scale: 0.95,
      filter: "brightness(0.4) grayscale(0.5)",
    };
    spriteTransition = { duration: 0.5 };
  }

  // Map the tailwind bg classes to border colors for the portrait frame
  const borderColorClass = fighter.color.replace("bg-", "border-");

  return (
    <motion.div
      initial={{ x: facing === "right" ? -300 : 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.5 }}
      className="flex flex-col items-center z-10 relative"
    >
      {/* 2D Fighting Game Health Bar */}
      <div
        className={`w-48 h-6 border-4 border-arena-border bg-black mb-4 p-0.5 relative shadow-lg overflow-hidden transition-opacity duration-500 ${
          isIntroPlaying ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* The Slow Catch-Up Bar (Damage Indicator) */}
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${hp}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute top-0.5 left-0.5 bottom-0.5 right-0.5 bg-yellow-400"
        />

        {/* The Fast Foreground Bar (Actual HP) */}
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${hp}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`absolute top-0.5 left-0.5 bottom-0.5 right-0.5 ${fighter.color} shadow-[inset_0_-4px_rgba(0,0,0,0.3)]`}
        />

        {/* The Glass Glare Overlay (For 3D pill effect) */}
        <div className="absolute top-0.5 left-0.5 right-0.5 h-1/3 bg-white/20 z-10 pointer-events-none" />
      </div>

      {/* The Portrait Sprite */}
      <motion.div
        animate={spriteAnimation}
        transition={spriteTransition}
        className={`w-32 h-40 border-4 bg-linear-to-b from-gray-800 to-black flex items-center justify-center relative overflow-hidden ${borderColorClass}`}
      >
        {/* Retro scanline overlay just for the portrait */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px] pointer-events-none z-10" />

        {/* The Emoji Avatar */}
        <div
          className="text-7xl absolute z-0"
          style={{
            transform: facing === "left" ? "scaleX(-1)" : "none",
            textShadow: "0 4px 0 rgba(0,0,0,0.5)", // 8-bit drop shadow effect
          }}
        >
          {fighter.avatar}
        </div>
      </motion.div>

      {/* Floating Arcade Callout */}
      <AnimatePresence>
        {showCallout && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -80,
              scale: [0.5, 1.5, 1.2, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              times: [0, 0.2, 0.8, 1],
              ease: "easeOut",
            }}
            className={`absolute top-0 z-50 pointer-events-none ${
              facing === "right" ? "right-0 -mr-20" : "left-0 -ml-20"
            }`}
          >
            <span
              className="text-5xl font-black italic uppercase tracking-tighter drop-shadow-[0_5px_0_rgba(0,0,0,1)] text-white"
              style={{
                WebkitTextStroke: `2px ${currentIntent === "counter" ? "#ff3c3c" : "#eab308"}`,
              }}
            >
              {currentIntent === "counter" ? "COUNTER!" : "OBJECTION!"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Tag */}
      <div
        className={`mt-4 px-3 py-1 border-2 bg-black tracking-widest uppercase font-bold text-xl transition-colors ${
          isActive
            ? `${borderColorClass} text-white`
            : "border-arena-border text-gray-600"
        }`}
      >
        {fighter.name}
      </div>
    </motion.div>
  );
}
