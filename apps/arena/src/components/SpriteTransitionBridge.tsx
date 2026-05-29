import { motion } from "framer-motion";
import { calculateCombatYPixels } from "../lib/spritePositioning";
import type { FighterDef } from "../types/fighter";

interface SpriteTransitionBridgeProps {
  fighterA: FighterDef;
  fighterB: FighterDef;
  isActive: boolean;
  onTransitionComplete?: () => void;
}

export function SpriteTransitionBridge({
  fighterA,
  fighterB,
  isActive,
  onTransitionComplete,
}: SpriteTransitionBridgeProps) {
  if (!isActive) return null;

  // Animate from setup silhouette (large, bottom-aligned) to combat stage (medium, centered)
  // Setup: h-[80vh] positioned at bottom corners
  // Combat: h-72 (~288px) positioned center, translate-y-[35vh]
  const transitionDuration = 0.6;
  const combatYPixels = calculateCombatYPixels(window.innerHeight);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: transitionDuration }}
      onAnimationComplete={onTransitionComplete}
      className="fixed inset-0 z-50 pointer-events-none flex items-start justify-between w-full"
      style={{ backgroundColor: "white" }}
    >
      {/* Fighter A: Left side - animates to combat screen position */}
      <motion.div
        initial={{
          x: -300,
          y: "20vh",
          scale: 2.5,
          opacity: 0,
        }}
        animate={{
          x: 0,
          y: combatYPixels,
          scale: 1,
          opacity: 1,
        }}
        transition={{
          duration: transitionDuration,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center justify-end"
      >
        <img
          src={fighterA.animations.idle}
          alt={`${fighterA.name} transition`}
          className="h-72 w-auto max-w-none object-contain object-bottom pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </motion.div>

      {/* Fighter B: Right side - mirrors left positioning */}
      <motion.div
        initial={{
          x: 300,
          y: "20vh",
          scale: 2.5,
          opacity: 0,
          scaleX: -1,
        }}
        animate={{
          x: 0,
          y: combatYPixels,
          scale: 1,
          opacity: 1,
          scaleX: -1,
        }}
        transition={{
          duration: transitionDuration,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center justify-end"
      >
        <img
          src={fighterB.animations.idle}
          alt={`${fighterB.name} transition`}
          className="h-72 w-auto max-w-none object-contain object-bottom pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </motion.div>
    </motion.div>
  );
}
