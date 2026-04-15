import { motion } from "framer-motion";
import type { FighterDef } from "../types/fighter";

interface FighterSpriteProps {
  fighter: FighterDef;
  isActive: boolean;
  facing: "left" | "right";
  hp: number;
  currentIntent?: string | null;
}

export function FighterSprite({
  fighter,
  isActive,
  facing,
  hp,
  currentIntent,
}: FighterSpriteProps) {
  const isAttack =
    isActive && (currentIntent === "counter" || currentIntent === "rebuttal");

  let spriteAnimation = {};
  if (isActive) {
    if (isAttack) {
      spriteAnimation = {
        x: facing === "right" ? [0, 40, 0] : [0, -40, 0],
        y: [0, -10, 0],
        scale: 1.1,
        filter: "brightness(1.5) drop-shadow(0 0 15px rgba(255,255,255,0.5))",
      };
    } else {
      spriteAnimation = {
        y: [0, -5, 0],
        scale: 1.05,
        filter: "brightness(1.2)",
      };
    }
  } else {
    spriteAnimation = {
      x: 0,
      y: 0,
      scale: 0.95,
      filter: "brightness(0.4) grayscale(0.5)",
    };
  }

  // Map the tailwind bg classes to border colors for the portrait frame
  const borderColorClass = fighter.color.replace("bg-", "border-");

  return (
    <div className="flex flex-col items-center z-10">
      {/* Dynamic Health Bar */}
      <div className="w-48 h-6 border-4 border-arena-border bg-black mb-4 p-0.5 relative shadow-lg">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${hp}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`h-full ${fighter.color} shadow-[inset_0_-4px_rgba(0,0,0,0.3)]`}
        />
      </div>

      {/* The Portrait Sprite */}
      <motion.div
        animate={spriteAnimation}
        transition={
          isAttack
            ? { duration: 0.3, ease: "easeOut" }
            : isActive
              ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
              : { duration: 0.5 }
        }
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
    </div>
  );
}
