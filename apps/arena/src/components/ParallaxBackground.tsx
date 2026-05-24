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
  const crowdMask =
    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 14%, rgba(0,0,0,0.18) 24%, rgba(0,0,0,0.34) 34%, rgba(0,0,0,0.5) 46%, rgba(0,0,0,0.62) 60%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,0.78) 100%)";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-gray-950">
      {/* Layer 1: Deep Background (Sky/Architecture) */}
      <motion.div
        animate={{
          x: isASpeaking ? "2%" : isBSpeaking ? "-2%" : "0%",
          y: "6%",
        }}
        transition={{ type: "spring", stiffness: 20, damping: 30 }}
        className="absolute inset-[-10%] w-[120%] h-full"
        style={{
          backgroundImage: 'url("/arena/Sky.png")',
          backgroundSize: "cover",
          backgroundPosition: "center 24%",
        }}
      />

      {/* Layer 2: The Crowd */}
      <motion.div
        animate={{
          x: isASpeaking ? "5%" : isBSpeaking ? "-5%" : "0%",
          y: "8%",
        }}
        transition={{ type: "spring", stiffness: 30, damping: 25 }}
        className="absolute inset-[-10%] w-[120%] h-full"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'url("/arena/Backdrop.png")',
            backgroundSize: "cover",
            backgroundPosition: "center 55%",
            WebkitMaskImage: crowdMask,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskImage: crowdMask,
            maskRepeat: "no-repeat",
            maskSize: "100% 100%",
          }}
        />
      </motion.div>

      {/* Layer 3: Stage Floor */}
      <motion.div
        animate={{
          x: isASpeaking ? "10%" : isBSpeaking ? "-10%" : "0%",
          y: "4%",
        }}
        transition={{ type: "spring", stiffness: 40, damping: 20 }}
        className="absolute bottom-0 left-[-20%] w-[140%] h-[33vh] border-t-4 border-gray-800 bg-gray-950 overflow-hidden"
      >
        <img
          src="/arena/Arena.png"
          alt="Arena ground"
          className="w-full h-full object-cover object-bottom opacity-100"
          draggable={false}
        />
      </motion.div>

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
