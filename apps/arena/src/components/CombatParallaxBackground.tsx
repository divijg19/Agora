import { motion } from "framer-motion";

interface CombatParallaxBackgroundProps {
  isASpeaking?: boolean;
  isBSpeaking?: boolean;
  isAttack?: boolean;
}

export function CombatParallaxBackground({
  isASpeaking = false,
  isBSpeaking = false,
  isAttack = false,
}: CombatParallaxBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-gray-950">
      <motion.div
        animate={{
          x: isASpeaking ? "2%" : isBSpeaking ? "-2%" : "0%",
          y: "8%",
        }}
        transition={{ type: "spring", stiffness: 20, damping: 30 }}
        className="absolute inset-[-10%] w-[120%] h-[120%] z-0"
        style={{
          backgroundImage: 'url("/arena/Arena_Full.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Aggressive Pulse Overlay (Only active during attacks) */}
      <motion.div
        animate={{ opacity: isAttack ? [0, 0.8, 0] : 0 }}
        transition={
          isAttack ? { duration: 0.3, ease: "easeOut" } : { duration: 0 }
        }
        className="absolute inset-0 bg-arena-red/30 mix-blend-overlay"
      />
    </div>
  );
}
