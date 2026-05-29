import { motion } from "framer-motion";
import {
  COMBAT_SPRITE_HEIGHT_PX,
  calculateCombatYPixels,
  TRANSITION_DURATION_MS,
  TRANSITION_INITIAL_SCALE,
  TRANSITION_INITIAL_X_OFFSET,
  TRANSITION_INITIAL_Y_VIEWPORT,
} from "../lib/spritePositioning";
import type { FighterDef } from "../types/fighter";

interface SpriteTransitionBridgeProps {
  fighterA: FighterDef;
  fighterB: FighterDef;
  onTransitionComplete?: () => void;
}

export function SpriteTransitionBridge({
  fighterA,
  fighterB,
  onTransitionComplete,
}: SpriteTransitionBridgeProps) {
  // Animate from setup silhouette (large, bottom-aligned) to combat stage (medium, centered)
  // Setup: h-[80vh] positioned at bottom corners
  // Combat: shared sprite height and translate-y-[35vh]
  const combatYPixels = calculateCombatYPixels(window.innerHeight);
  const transitionDuration = TRANSITION_DURATION_MS / 1000;

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
          x: -TRANSITION_INITIAL_X_OFFSET,
          y: TRANSITION_INITIAL_Y_VIEWPORT,
          scale: TRANSITION_INITIAL_SCALE,
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
          className="w-auto max-w-none object-contain object-bottom pixelated"
          style={{
            height: COMBAT_SPRITE_HEIGHT_PX,
            imageRendering: "pixelated",
          }}
        />
      </motion.div>

      {/* Fighter B: Right side - mirrors left positioning */}
      <motion.div
        initial={{
          x: TRANSITION_INITIAL_X_OFFSET,
          y: TRANSITION_INITIAL_Y_VIEWPORT,
          scale: TRANSITION_INITIAL_SCALE,
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
          className="w-auto max-w-none object-contain object-bottom pixelated"
          style={{
            height: COMBAT_SPRITE_HEIGHT_PX,
            imageRendering: "pixelated",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
