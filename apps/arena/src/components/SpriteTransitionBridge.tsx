import { motion } from "framer-motion";
import { useViewportHeight } from "../hooks/useViewportHeight.ts";
import {
  COMBAT_SPRITE_HEIGHT_PX,
  getCombatGroundYPixels,
  getTransitionStartYPixels,
  TRANSITION_DURATION_MS,
  TRANSITION_INITIAL_SCALE,
  TRANSITION_INITIAL_X_OFFSET,
} from "../lib/spritePositioning";
import type { FighterDef } from "../types/fighter";
import { VersusBanner } from "./VersusBanner";

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
  const viewportHeight = useViewportHeight();
  const combatYPixels = getCombatGroundYPixels(viewportHeight);
  const transitionDuration = TRANSITION_DURATION_MS / 1000;
  const bridgeStartY = getTransitionStartYPixels(viewportHeight);

  // Bridge no longer owns banner timing; VersusBanner will call onHidden

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: transitionDuration }}
      className="fixed inset-0 z-50 pointer-events-none flex items-start justify-between w-full overflow-hidden bg-gray-950"
    >
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: transitionDuration }}
        className="absolute inset-[-10%] z-0 w-[120%] h-[120%]"
        style={{
          backgroundImage: 'url("/arena/Arena_Full.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: transitionDuration }}
        className="absolute inset-0 z-0 bg-gray-950/35"
      />

      {/* Versus Banner / Intro Text */}
      <VersusBanner
        leftName={fighterA.name}
        rightName={fighterB.name}
        variant="intro"
        preset="cinematic"
        onHidden={onTransitionComplete}
      />

      {/* Fighter A: Left side - animates to combat screen position */}
      <motion.div
        initial={{
          x: -TRANSITION_INITIAL_X_OFFSET,
          y: bridgeStartY,
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
          type: "spring",
          stiffness: 70,
          damping: 16,
          mass: 1.1,
        }}
        className="relative z-10 flex flex-col items-center justify-end"
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
          y: bridgeStartY,
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
          type: "spring",
          stiffness: 70,
          damping: 16,
          mass: 1.1,
        }}
        className="relative z-10 flex flex-col items-center justify-end"
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
