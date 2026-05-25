import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { MatchVerdict } from "../hooks/useEngineStream";
import type { FighterDef } from "../types/fighter";

const POINTING_INTENTS = [
  "counter",
  "rebuttal",
  "attack",
  "objection",
] as const;

interface FighterSpriteProps {
  fighter: FighterDef;
  isActive: boolean;
  facing: "left" | "right";
  hp: number;
  currentIntent?: string | null;
  isIntroPlaying: boolean;
  isBeingAttacked?: boolean;
  verdict?: MatchVerdict | null;
  userVote?: string | null;
}

export function FighterSprite({
  fighter,
  isActive,
  facing,
  hp: _hp,
  currentIntent,
  isIntroPlaying: _isIntroPlaying,
  isBeingAttacked = false,
  verdict,
  userVote,
}: FighterSpriteProps) {
  const [isStunned, setIsStunned] = useState(false);
  const [showCallout, setShowCallout] = useState(false);
  const currentIntentKey = currentIntent ?? "";
  const isCounter = currentIntentKey === "counter";
  const isMirrored = facing === "left";
  const isPointing =
    isActive &&
    POINTING_INTENTS.includes(
      currentIntentKey as (typeof POINTING_INTENTS)[number],
    );

  useEffect(() => {
    if (isBeingAttacked) {
      setIsStunned(true);
      const timer = setTimeout(() => setIsStunned(false), 800);
      return () => clearTimeout(timer);
    }

    setIsStunned(false);
  }, [isBeingAttacked]);

  useEffect(() => {
    if (isPointing) {
      setShowCallout(true);
      const timer = setTimeout(() => setShowCallout(false), 1500);
      return () => clearTimeout(timer);
    }

    setShowCallout(false);
  }, [isPointing]);

  const isDefeated = verdict && userVote && verdict.winner_id !== fighter.id;
  const spriteSrc = isPointing
    ? fighter.animations.pointing
    : fighter.animations.idle;

  let spriteAnimation = {};
  let spriteTransition = {};

  if (isDefeated) {
    spriteAnimation = {
      y: 200,
      rotate: facing === "right" ? -90 : 90,
      opacity: 0,
      filter: "grayscale(1)",
    };
    spriteTransition = { duration: 1.5, ease: "easeIn" };
  } else if (isActive) {
    if (isPointing) {
      spriteAnimation = {
        x: facing === "right" ? [0, 40, 0] : [0, -40, 0],
        y: [0, -10, 0],
        scale: 1.15,
        filter: "brightness(1.5) drop-shadow(0 0 15px rgba(255,255,255,0.5))",
      };
      spriteTransition = { duration: 0.3, ease: "easeOut" };
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
  const yOffset = fighter.id === "economist" ? "4%" : "0%";

  // Health bars moved to CombatScreen (top corners)
  return (
    <motion.div
      initial={{ x: facing === "right" ? -300 : 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.5 }}
      className="flex flex-col items-center z-10 relative"
    >
      {/* The Portrait Sprite */}
      <motion.div
        animate={spriteAnimation}
        transition={spriteTransition}
        className="w-auto h-72 flex items-end justify-center relative overflow-visible drop-shadow-2xl"
        style={{ transformOrigin: "bottom center" }}
      >
        <img
          src={spriteSrc}
          alt={`${fighter.name} ${isPointing ? "pointing" : "idle"}`}
          className="h-full w-auto max-w-none object-contain object-bottom pixelated"
          style={{
            transform: `translateY(${yOffset}) ${isMirrored ? "scaleX(-1)" : ""}`,
            imageRendering: "pixelated",
          }}
        />
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
                WebkitTextStroke: `2px ${isCounter ? "#ff3c3c" : "#eab308"}`,
              }}
            >
              {isCounter ? "COUNTER!" : "OBJECTION!"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
