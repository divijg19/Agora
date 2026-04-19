import { motion } from "framer-motion";

interface ParallaxBackgroundProps {
  isASpeaking?: boolean;
  isBSpeaking?: boolean;
  isAttack?: boolean;
}

export function ParallaxBackground({
  isASpeaking = false,
  isBSpeaking = false,
  isAttack = false,
}: ParallaxBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-gray-950">
      {/* Layer 1: Deep Background (Sky/Architecture) */}
      <motion.div
        animate={{ x: isASpeaking ? "2%" : isBSpeaking ? "-2%" : "0%" }}
        transition={{ type: "spring", stiffness: 20, damping: 30 }}
        className="absolute inset-[-10%] w-[120%] h-full bg-gray-900 opacity-50"
        style={{
          backgroundImage:
            'url("https://placehold.co/1920x1080/111/333?text=DEEP+BACKGROUND")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Layer 2: The Crowd */}
      <motion.div
        animate={{ x: isASpeaking ? "5%" : isBSpeaking ? "-5%" : "0%" }}
        transition={{ type: "spring", stiffness: 30, damping: 25 }}
        className="absolute inset-[-10%] w-[120%] h-full opacity-60"
      >
        <div
          className="w-full h-full animate-[bounce_2s_infinite]"
          style={{
            backgroundImage:
              'url("https://placehold.co/1920x1080/222/444?text=THE+CROWD")',
            backgroundSize: "cover",
            backgroundPosition: "bottom",
          }}
        />
      </motion.div>

      {/* Layer 3: Stage Floor */}
      <motion.div
        animate={{ x: isASpeaking ? "10%" : isBSpeaking ? "-10%" : "0%" }}
        transition={{ type: "spring", stiffness: 40, damping: 20 }}
        className="absolute bottom-0 left-[-20%] w-[140%] h-[30vh] border-t-4 border-gray-800"
        style={{
          backgroundImage:
            'url("https://placehold.co/1920x400/000/222?text=STAGE+FLOOR")',
          backgroundSize: "cover",
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
