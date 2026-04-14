import { motion } from "framer-motion";
import type { FighterDef } from "../lib/roster";

interface FighterSpriteProps {
  fighter: FighterDef;
  isActive: boolean;
  facing: "left" | "right";
}

export function FighterSprite({
  fighter,
  isActive,
  facing,
}: FighterSpriteProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Health Bar (Visual fluff for game feel) */}
      <div className="w-48 h-4 border-2 border-arena-border bg-black mb-4 p-0.5">
        <div
          className={`h-full ${fighter.color} transition-all duration-500 w-full`}
        />
      </div>

      {/* The Sprite Block */}
      <motion.div
        animate={
          isActive
            ? { y: [0, -10, 0], scale: 1.05, filter: "brightness(1.5)" }
            : { y: 0, scale: 1, filter: "brightness(0.5)" }
        }
        transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
        className={`w-32 h-48 border-4 border-arena-border flex items-center justify-center relative ${fighter.color}`}
      >
        {/* "Eye" to show facing direction */}
        <div
          className={`absolute top-8 w-8 h-4 bg-black ${facing === "right" ? "right-4" : "left-4"}`}
        />
      </motion.div>

      {/* Name Tag */}
      <div
        className={`mt-4 text-2xl font-bold uppercase ${isActive ? "text-white" : "text-gray-600"}`}
      >
        {fighter.name}
      </div>
    </div>
  );
}
