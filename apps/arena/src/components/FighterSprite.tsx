import { motion } from "framer-motion";
import type { FighterDef } from "../lib/roster";

interface FighterSpriteProps {
  fighter: FighterDef;
  isActive: boolean;
  facing: "left" | "right";
  hp: number; // 0 to 100
  currentIntent?: string | null;
}

export function FighterSprite({
  fighter,
  isActive,
  facing,
  hp,
  currentIntent,
}: FighterSpriteProps) {
  // Determine if this turn is an aggressive attack
  const isAttack =
    isActive && (currentIntent === "counter" || currentIntent === "rebuttal");

  // Calculate dynamic animation states
  let spriteAnimation = {};
  if (isActive) {
    if (isAttack) {
      // Violent lunge forward
      spriteAnimation = {
        x: facing === "right" ? [0, 40, 0] : [0, -40, 0],
        y: [0, -10, 0],
        scale: 1.1,
        filter: "brightness(1.8) drop-shadow(0 0 10px rgba(255,0,0,0.8))",
      };
    } else {
      // Standard speaking bob
      spriteAnimation = {
        y: [0, -5, 0],
        scale: 1.05,
        filter: "brightness(1.3)",
      };
    }
  } else {
    // Idle state
    spriteAnimation = {
      x: 0,
      y: 0,
      scale: 1,
      filter: "brightness(0.5)",
    };
  }

  return (
    <div className="flex flex-col items-center z-10">
      {/* Dynamic Health Bar */}
      <div className="w-48 h-6 border-4 border-arena-border bg-black mb-4 p-0.5 relative shadow-lg">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${hp}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`h-full ${fighter.color}`}
        />
      </div>

      {/* The Sprite Block */}
      <motion.div
        animate={spriteAnimation}
        transition={
          isAttack
            ? { duration: 0.3, ease: "easeOut" }
            : isActive
              ? { repeat: Infinity, duration: 1.5 }
              : { duration: 0.5 }
        }
        className={`w-32 h-48 border-4 border-arena-border flex items-center justify-center relative ${fighter.color}`}
      >
        {/* "Eye" to show facing direction */}
        <div
          className={`absolute top-8 w-8 h-4 bg-black ${facing === "right" ? "right-4" : "left-4"}`}
        />
      </motion.div>

      {/* Name Tag */}
      <div
        className={`mt-4 text-2xl font-bold uppercase tracking-widest ${isActive ? "text-white" : "text-gray-600"}`}
      >
        {fighter.name}
      </div>
    </div>
  );
}
