import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEngineStream } from "../hooks/useEngineStream";
import type { FighterDef } from "../types/fighter";
import { CombatParallaxBackground } from "./CombatParallaxBackground";
import { DialogueBox } from "./DialogueBox";
import { FighterSprite } from "./FighterSprite";

interface CombatScreenProps {
  matchId: string;
  topic: string;
  fighterA: FighterDef;
  fighterB: FighterDef;
  onRestart: () => void;
}

const CHEVRON_DOUBLE_INTENTS = new Set([
  "attack",
  "counter",
  "rebuttal",
  "objection",
  "special",
]);

const AGGRESSIVE_INTENTS = new Set(["attack", "counter", "objection"]);

const ORB_FLAME_TONGUES = [
  {
    id: "north-west",
    className: "left-[12%] top-[16%] h-[42%] w-[12%] rotate-[-22deg]",
    delay: "0s",
    duration: "1.8s",
  },
  {
    id: "north",
    className: "left-[34%] top-[6%] h-[58%] w-[14%] rotate-[-8deg]",
    delay: "0.16s",
    duration: "1.55s",
  },
  {
    id: "south",
    className: "right-[34%] top-[6%] h-[58%] w-[14%] rotate-[8deg]",
    delay: "0.28s",
    duration: "1.55s",
  },
  {
    id: "north-east",
    className: "right-[12%] top-[16%] h-[42%] w-[12%] rotate-[22deg]",
    delay: "0.42s",
    duration: "1.8s",
  },
];

// Inner flame wisps that rise within the orb volume (subtle, inward-focused).
const ORB_INNER_FLAMES = [
  {
    id: "inner-left",
    className: "left-[8%] top-[20%] h-[35%] w-[10%] rotate-[-15deg]",
    delay: "0.05s",
    duration: "2.2s",
  },
  {
    id: "inner-center",
    className: "left-[40%] top-[10%] h-[48%] w-[10%] rotate-[0deg]",
    delay: "0.2s",
    duration: "2.0s",
  },
  {
    id: "inner-right",
    className: "right-[8%] top-[20%] h-[35%] w-[10%] rotate-[15deg]",
    delay: "0.35s",
    duration: "2.2s",
  },
];

export function CombatScreen({
  matchId,
  topic,
  fighterA,
  fighterB,
  onRestart,
}: CombatScreenProps) {
  const {
    status,
    currentSpeaker,
    currentIntent,
    rawText,
    networkTurns,
    visualTurnIndex,
    advanceVisualTurn,
    verdict,
    turnCount,
    errorMessage,
  } = useEngineStream(matchId);
  const [showVerdictModal, setShowVerdictModal] = useState(true);
  const [showVotePrompt, setShowVotePrompt] = useState(false);
  const [activeCamera, setActiveCamera] = useState<"profile" | "topDown">(
    "profile",
  );
  const [userVote, setUserVote] = useState<string | null>(null);
  const isTyping = false;
  const [activeSpeakerVisual, setActiveSpeakerVisual] = useState<string | null>(
    null,
  );
  const [activeIntentVisual, setActiveIntentVisual] = useState<string | null>(
    null,
  );
  const [isIntroPlaying, setIsIntroPlaying] = useState(true);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroPlaying(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setActiveSpeakerVisual(currentSpeaker);
      setActiveIntentVisual(currentIntent);
    }
  }, [currentSpeaker, currentIntent]);

  useEffect(() => {
    if (status === "completed") {
      setShowVerdictModal(true);
      setShowVotePrompt(false);
      setUserVote(null);
    } else {
      setShowVotePrompt(false);
    }
  }, [status]);

  const isASpeaking = status !== "error" && activeSpeakerVisual === fighterA.id;
  const isBSpeaking = status !== "error" && activeSpeakerVisual === fighterB.id;
  const isJudge = status !== "error" && activeSpeakerVisual === "judge";

  let speakerName: string | null = null;
  if (isASpeaking) speakerName = fighterA.name;
  if (isBSpeaking) speakerName = fighterB.name;
  if (isJudge) speakerName = "THE JUDGE";

  // Cinematic Director Logic
  useEffect(() => {
    if (status !== "debating") {
      setActiveCamera("profile");
      return;
    }

    // 30% chance to cut to Top-Down on Rebuttals or Closings
    if (currentIntent === "rebuttal" || currentIntent === "closing") {
      const roll = Math.random();
      if (roll > 0.7) {
        setActiveCamera("topDown");
        return;
      }
    }

    // Otherwise, stay in 2D profile
    setActiveCamera("profile");
  }, [status, currentIntent]);

  // Calculate HP for game feel (Loser drops to 0 at the end)
  const hasBufferedTurnAhead = visualTurnIndex < networkTurns.length - 1;
  const isComplete =
    status === "completed" &&
    verdict !== null &&
    !hasBufferedTurnAhead &&
    !isTyping;
  const modalOpen = isComplete && showVerdictModal;
  const fighterABorderClass = fighterA.color.replace("bg-", "border-");
  const fighterBBorderClass = fighterB.color.replace("bg-", "border-");
  const hpA =
    isComplete && userVote
      ? verdict.winner_id === fighterA.id
        ? 100
        : 0
      : 100;
  const hpB =
    isComplete && userVote
      ? verdict.winner_id === fighterB.id
        ? 100
        : 0
      : 100;
  const winnerName =
    isComplete && verdict.winner_id === fighterA.id
      ? fighterA.name
      : isComplete && verdict.winner_id === fighterB.id
        ? fighterB.name
        : "UNKNOWN";
  const isAttack =
    (isASpeaking || isBSpeaking) &&
    (activeIntentVisual === "counter" || activeIntentVisual === "rebuttal");
  const isKO = isComplete && userVote !== null;
  const fighterAId = fighterA.id;
  const fighterBId = fighterB.id;
  const ROSTER = [fighterA, fighterB];
  const isAChevronDouble =
    isASpeaking && activeIntentVisual !== null
      ? CHEVRON_DOUBLE_INTENTS.has(activeIntentVisual)
      : false;
  const isBChevronDouble =
    isBSpeaking && activeIntentVisual !== null
      ? CHEVRON_DOUBLE_INTENTS.has(activeIntentVisual)
      : false;

  const intentFillPercent = useCallback((intent: string | null) => {
    if (!intent) return 0;
    if (intent === "special" || intent === "counter" || intent === "rebuttal")
      return 30;
    return 0;
  }, []);

  const baseTurnCharge = 10;

  // orbA/orbB instantaneous values removed; using persistent `orbChargeA/B` instead

  // Persistent charge values that accumulate when fighters perform actions
  const [orbChargeA, setOrbChargeA] = useState(0);
  const [orbChargeB, setOrbChargeB] = useState(0);
  const [orbPulseA, setOrbPulseA] = useState(false);
  const [orbPulseB, setOrbPulseB] = useState(false);
  const orbChargeRatioA = orbChargeA / 100;
  const orbChargeRatioB = orbChargeB / 100;

  // Color palette helper
  const rgba = (rgb: [number, number, number], a = 1) =>
    `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

  // Use only blue and orange palettes. Each palette has matching stops.
  const BLUE_STOPS: [number, number, number][] = [
    [191, 219, 254],
    [96, 165, 250],
    [59, 130, 246],
    [37, 99, 235],
  ];
  const ORANGE_STOPS: [number, number, number][] = [
    [253, 186, 116],
    [249, 115, 22],
    [234, 88, 12],
    [154, 52, 18],
  ];

  const colorsForCharge = (charge: number) => {
    const clamped = Math.max(0, Math.min(100, charge));

    // Fill stops stay in the same blue-to-orange family, without white.
    let s0: [number, number, number],
      s1: [number, number, number],
      s2: [number, number, number],
      s3: [number, number, number];
    if (clamped < 70) {
      s0 = BLUE_STOPS[0];
      s1 = BLUE_STOPS[1];
      s2 = BLUE_STOPS[2];
      s3 = BLUE_STOPS[3];
    } else {
      s0 = ORANGE_STOPS[0];
      s1 = ORANGE_STOPS[1];
      s2 = ORANGE_STOPS[2];
      s3 = ORANGE_STOPS[3];
    }

    const fillGradient = `linear-gradient(180deg, ${rgba(s0, 0.98)} 0%, ${rgba(s1, 0.95)} 24%, ${rgba(s2, 0.9)} 64%, ${rgba(s3, 0.98)} 100%)`;

    // Flame palette (no white): explicit stops by charge range.
    let fA: [number, number, number],
      fB: [number, number, number],
      fC: [number, number, number];
    if (clamped < 70) {
      fA = [37, 99, 235];
      fB = [59, 130, 246];
      fC = [147, 197, 253];
    } else if (clamped < 100) {
      fA = [234, 88, 12];
      fB = [249, 115, 22];
      fC = [253, 186, 116];
    } else {
      fA = [154, 52, 18];
      fB = [194, 65, 12];
      fC = [234, 88, 12];
    }

    const flameGradient = `linear-gradient(to top, ${rgba(fA, 0.95)} 0%, ${rgba(fB, 0.9)} 42%, ${rgba(fC, 0.72)} 76%, transparent 100%)`;
    const coreGradient = `radial-gradient(circle at 50% 50%, ${rgba(fC, 0.9)} 0%, ${rgba(fB, 0.6)} 30%, ${rgba(fA, 0.2)} 70%, transparent 100%)`;
    const coronaGradient = `radial-gradient(circle at 50% 50%, ${rgba(fB, 0.5)} 0%, ${rgba(fA, 0.2)} 50%, transparent 70%)`;
    const backFlameGradient = `radial-gradient(ellipse at 50% 58%, ${rgba(fC, 0.95)} 0%, ${rgba(fB, 0.82)} 18%, ${rgba(fA, 0.55)} 38%, ${rgba(fA, 0.2)} 58%, transparent 76%)`;
    const bottomCoronaGradient = `radial-gradient(ellipse at 50% 62%, ${rgba(fC, 0.9)} 0%, ${rgba(fB, 0.78)} 18%, ${rgba(fA, 0.45)} 42%, transparent 74%)`;
    const rimGlowGradient = `radial-gradient(circle at 50% 50%, ${rgba(fC, 0.78)} 0%, ${rgba(fB, 0.42)} 34%, transparent 72%)`;
    const tongueGradient = `linear-gradient(to top, ${rgba(fA, 0.98)} 0%, ${rgba(fB, 0.9)} 34%, ${rgba(fC, 0.55)} 76%, transparent 100%)`;
    const highGlow = `radial-gradient(circle at 50% 50%, ${rgba(fC, 0.95)} 0%, ${rgba(fB, 0.62)} 32%, transparent 72%)`;

    return {
      fillGradient,
      flameGradient,
      coreGradient,
      coronaGradient,
      backFlameGradient,
      bottomCoronaGradient,
      rimGlowGradient,
      tongueGradient,
      highGlow,
    };
  };

  const orbColorsA = colorsForCharge(orbChargeA);
  const orbColorsB = colorsForCharge(orbChargeB);
  const orbMotionA = Math.max(2.8, 5.2 - orbChargeRatioA * 1.6);
  const orbMotionB = Math.max(2.8, 5.2 - orbChargeRatioB * 1.6);

  useEffect(() => {
    const amount = baseTurnCharge + intentFillPercent(activeIntentVisual);
    if (isASpeaking && amount > 0) {
      setOrbChargeA((prev) => {
        const next = Math.min(100, prev + amount);
        if (next > prev) {
          setOrbPulseA(true);
          setTimeout(() => setOrbPulseA(false), 350);
        }
        return next;
      });
    }

    if (isBSpeaking && amount > 0) {
      setOrbChargeB((prev) => {
        const next = Math.min(100, prev + amount);
        if (next > prev) {
          setOrbPulseB(true);
          setTimeout(() => setOrbPulseB(false), 350);
        }
        return next;
      });
    }

    if (activeIntentVisual && AGGRESSIVE_INTENTS.has(activeIntentVisual)) {
      if (isASpeaking) {
        setOrbChargeB((prev) => {
          const next = Math.min(100, prev + 10);
          if (next > prev) {
            setOrbPulseB(true);
            setTimeout(() => setOrbPulseB(false), 350);
          }
          return next;
        });
      }

      if (isBSpeaking) {
        setOrbChargeA((prev) => {
          const next = Math.min(100, prev + 10);
          if (next > prev) {
            setOrbPulseA(true);
            setTimeout(() => setOrbPulseA(false), 350);
          }
          return next;
        });
      }
    }
    // run when intent or speaker changes
  }, [activeIntentVisual, isASpeaking, isBSpeaking, intentFillPercent]);

  // animate orb scale via Framer Motion when its fill changes

  useEffect(() => {
    if (isComplete && !userVote) {
      const timer = setTimeout(() => setShowVotePrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, userVote]);

  // Reset orbs when verdict is confirmed
  useEffect(() => {
    if (isComplete && userVote) {
      // Brief delay to let discharge animation play before reset
      const resetTimer = setTimeout(() => {
        setOrbChargeA(0);
        setOrbChargeB(0);
      }, 300);
      return () => clearTimeout(resetTimer);
    }
  }, [isComplete, userVote]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={
        isKO
          ? {
              x: [-15, 15, -10, 10, -5, 5, 0],
              y: [-5, 5, -5, 5, 0],
              opacity: 1,
            }
          : isAttack
            ? { x: [-5, 5, -5, 5, 0], y: [-2, 2, -2, 2, 0], opacity: 1 }
            : { x: 0, y: 0, opacity: 1 }
      }
      transition={
        isKO
          ? { duration: 0.8, ease: "easeOut" }
          : isAttack
            ? { duration: 0.4 }
            : { duration: 0.5 }
      }
      className="w-full mx-auto p-4 flex flex-col h-[95vh] relative z-10"
    >
      {/* --- CAMERA SYSTEM --- */}
      <AnimatePresence mode="wait">
        {activeCamera === "profile" ? (
          <motion.div
            key="camera-profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <CombatParallaxBackground
              isASpeaking={isASpeaking}
              isBSpeaking={isBSpeaking}
              isAttack={isAttack}
            />
          </motion.div>
        ) : (
          <motion.div
            key="camera-topdown"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: ["0%", "-5%", "0%"],
              y: ["0%", "5%", "0%"],
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 },
              x: { repeat: Infinity, duration: 20, ease: "linear" },
              y: { repeat: Infinity, duration: 25, ease: "linear" },
            }}
            className="absolute inset-[-10%] w-[120%] h-[120%] -z-10 pointer-events-none"
            style={{
              backgroundImage: 'url("/arena/Arena_Full.png")',
              backgroundSize: "100%",
              backgroundPosition: "center",
            }}
          />
        )}
      </AnimatePresence>

      {/* Cinematic Health Bars (Top Corners) */}
      <div className="absolute top-6 left-6 z-60 w-72 pointer-events-none">
        <div className="w-full h-8 bg-black border-4 border-arena-border p-1 relative shadow-lg overflow-hidden rounded-md">
          {/* Slow catch-up (damage indicator) */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${hpA}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="absolute left-0 top-0 bottom-0 bg-yellow-400"
          />

          {/* Fast foreground (actual HP) */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${hpA}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`absolute left-0 top-0 bottom-0 ${fighterA.color} shadow-[inset_0_-4px_rgba(0,0,0,0.3)]`}
          />

          {/* Glass glare overlay */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 z-10 pointer-events-none" />
        </div>

        <div className="grid grid-cols-[28px_1fr] items-center gap-3 pl-4">
          <motion.div
            className="relative h-7 w-7 overflow-visible"
            animate={{ scale: orbPulseA ? 1.12 : 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.35,
            }}
            aria-hidden
          >
            {orbChargeA > 0 && (
              <motion.div
                className="absolute left-1/2 top-1/2 h-[168%] w-[168%] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  background: orbColorsA.backFlameGradient,
                  filter: "blur(3.5px)",
                  mixBlendMode: "screen",
                  transformOrigin: "50% 100%",
                }}
                animate={{
                  opacity: [
                    0.14 + orbChargeRatioA * 0.44,
                    0.18 + orbChargeRatioA * 0.56,
                    0.16 + orbChargeRatioA * 0.5,
                  ],
                  scaleX: [
                    0.92 + orbChargeRatioA * 0.12,
                    0.96 + orbChargeRatioA * 0.16,
                    0.93 + orbChargeRatioA * 0.14,
                  ],
                  scaleY: [
                    0.9 + orbChargeRatioA * 0.22,
                    0.98 + orbChargeRatioA * 0.34,
                    0.92 + orbChargeRatioA * 0.28,
                  ],
                  y: [0, -2, -1],
                }}
                transition={{ duration: orbMotionA, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {orbChargeA > 12 && (
              <motion.div
                className="absolute inset-[12%] rounded-full overflow-hidden pointer-events-none"
                animate={{
                  opacity: [
                    0.08 + orbChargeRatioA * 0.34,
                    0.12 + orbChargeRatioA * 0.42,
                    0.1 + orbChargeRatioA * 0.38,
                  ],
                  scale: [
                    0.99 + orbChargeRatioA * 0.02,
                    1.0 + orbChargeRatioA * 0.04,
                    0.995 + orbChargeRatioA * 0.03,
                  ],
                  y: [4, 0, -2],
                }}
                transition={{ duration: orbMotionA, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: orbColorsA.bottomCoronaGradient,
                  backgroundPosition: "center bottom",
                  filter: "blur(1.8px)",
                  transformOrigin: "50% 50%",
                }}
              />
            )}

            {orbChargeA > 12 && (
              <div className="absolute inset-[10%] rounded-full overflow-hidden pointer-events-none">
                {ORB_FLAME_TONGUES.map((tongue) => (
                  <motion.div
                    key={tongue.id}
                    className={`absolute rounded-full ${tongue.className}`}
                    style={{
                      background: orbColorsA.rimGlowGradient,
                      filter: "blur(0.6px)",
                      transformOrigin: "50% 100%",
                    }}
                    animate={{
                      opacity: [
                        0.12 + orbChargeRatioA * 0.42,
                        0.18 + orbChargeRatioA * 0.7,
                        0.14 + orbChargeRatioA * 0.55,
                      ],
                      scale: [
                        0.7 + orbChargeRatioA * (orbChargeA >= 70 ? 0.36 : 0.24),
                        0.76 + orbChargeRatioA * (orbChargeA >= 70 ? 0.48 : 0.3),
                        0.72 + orbChargeRatioA * (orbChargeA >= 70 ? 0.4 : 0.26),
                      ],
                      y: [3, -1, 1],
                      rotate: [-4, 4, -2],
                    }}
                    transition={{
                      duration: orbMotionA,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: parseFloat(tongue.delay),
                    }}
                  />
                ))}
              </div>
            )}

            <motion.div
              className="absolute inset-0 rounded-full border border-[#2f6bff]/20 shadow-inner overflow-hidden"
              animate={{ scale: orbPulseA ? 1 : 1 }}
              aria-hidden
            >
              <div className="absolute inset-0 rounded-full bg-[#081224]" />

              <motion.div
                className="absolute inset-[8%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsA.coreGradient,
                  filter: "blur(1.5px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  scale: 0.78 + orbChargeRatioA * 0.2,
                  opacity: 0.15 + Math.min(0.85, orbChargeRatioA),
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />

              <motion.div
                className="absolute inset-[14%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsA.coreGradient,
                  filter: "blur(2px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  opacity: Math.max(0, Math.min(0.9, orbChargeRatioA * 1.1)),
                  scale: 0.9 + orbChargeRatioA * 0.15,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />

              <motion.div
                className="absolute inset-[16%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsA.highGlow,
                  filter: "blur(1.2px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  opacity:
                    orbChargeA > 45
                      ? 0.2 + Math.min(0.66, orbChargeRatioA)
                      : 0,
                  scale: 0.9 + orbChargeRatioA * 0.12,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />

              {orbChargeA > 10 && (
                <div className="absolute inset-0 pointer-events-none">
                  {ORB_INNER_FLAMES.map((flame) => (
                    <motion.div
                      key={flame.id}
                      className={`absolute rounded-full ${flame.className}`}
                      style={{
                        background: orbColorsA.flameGradient,
                        filter: "blur(0.9px)",
                        transformOrigin: "50% 100%",
                      }}
                      animate={{
                        opacity: [
                          0.18 + orbChargeRatioA * 0.46,
                          0.28 + orbChargeRatioA * 0.62,
                          0.2 + orbChargeRatioA * 0.52,
                        ],
                        scale: [
                          0.6 + orbChargeRatioA * (orbChargeA >= 70 ? 0.42 : 0.28),
                          0.66 + orbChargeRatioA * (orbChargeA >= 70 ? 0.52 : 0.34),
                          0.62 + orbChargeRatioA * (orbChargeA >= 70 ? 0.46 : 0.3),
                        ],
                        y: [4, -1, 2],
                        rotate: [-2, 2, 0],
                      }}
                      transition={{
                        duration: orbMotionA,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: parseFloat(flame.delay),
                      }}
                    />
                  ))}
                </div>
              )}

              <motion.div
                className="absolute left-0 right-0 bottom-0 rounded-b-full"
                animate={{ height: `${orbChargeA}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                style={{
                  background: orbColorsA.fillGradient,
                }}
              />
            </motion.div>
          </motion.div>

          <div>
            <div
              className={`inline-flex items-center self-start border-2 bg-black px-3 py-1.5 text-base font-black uppercase tracking-[0.12em] leading-none text-white transition-colors ${fighterABorderClass}`}
            >
              <span
                className={`mr-2 font-mono transition-all duration-300 ${isASpeaking ? "text-yellow-300 opacity-100 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" : "text-white/35 opacity-40"}`}
              >
                {isAChevronDouble ? ">>" : ">"}
              </span>
              {fighterA.name}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-60 w-72 pointer-events-none text-right">
        <div className="w-full h-8 bg-black border-4 border-arena-border p-1 relative shadow-lg overflow-hidden rounded-md">
          {/* Slow catch-up (damage indicator) */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${hpB}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="absolute left-0 top-0 bottom-0 bg-yellow-400"
          />

          {/* Fast foreground (actual HP) */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${hpB}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`absolute left-0 top-0 bottom-0 ${fighterB.color} shadow-[inset_0_-4px_rgba(0,0,0,0.3)]`}
          />

          {/* Glass glare overlay */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 z-10 pointer-events-none" />
        </div>

        <div className="grid grid-cols-[1fr_28px] items-center gap-3 justify-end pr-4">
          <div className="flex justify-end">
            <div
              className={`inline-flex items-center self-end border-2 bg-black px-3 py-1.5 text-base font-black uppercase tracking-[0.12em] leading-none text-white transition-colors ${fighterBBorderClass}`}
            >
              {fighterB.name}
              <span
                className={`ml-2 font-mono transition-all duration-300 ${isBSpeaking ? "text-yellow-300 opacity-100 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" : "text-white/35 opacity-40"}`}
              >
                {isBChevronDouble ? "<<" : "<"}
              </span>
            </div>
          </div>

          <motion.div
            className="relative h-7 w-7 overflow-visible"
            animate={{ scale: orbPulseB ? 1.12 : 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.35,
            }}
            aria-hidden
          >
            {orbChargeB > 0 && (
              <motion.div
                className="absolute left-1/2 top-1/2 h-[168%] w-[168%] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                  background: orbColorsB.backFlameGradient,
                  filter: "blur(3.5px)",
                  mixBlendMode: "screen",
                  transformOrigin: "50% 100%",
                }}
                animate={{
                  opacity: [
                    0.14 + orbChargeRatioB * 0.44,
                    0.18 + orbChargeRatioB * 0.56,
                    0.16 + orbChargeRatioB * 0.5,
                  ],
                  scaleX: [
                    0.92 + orbChargeRatioB * 0.12,
                    0.96 + orbChargeRatioB * 0.16,
                    0.93 + orbChargeRatioB * 0.14,
                  ],
                  scaleY: [
                    0.9 + orbChargeRatioB * 0.22,
                    0.98 + orbChargeRatioB * 0.34,
                    0.92 + orbChargeRatioB * 0.28,
                  ],
                  y: [0, -2, -1],
                }}
                transition={{ duration: orbMotionB, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {orbChargeB > 12 && (
              <motion.div
                className="absolute inset-[12%] rounded-full overflow-hidden pointer-events-none"
                animate={{
                  opacity: [
                    0.08 + orbChargeRatioB * 0.34,
                    0.12 + orbChargeRatioB * 0.42,
                    0.1 + orbChargeRatioB * 0.38,
                  ],
                  scale: [
                    0.99 + orbChargeRatioB * 0.02,
                    1.0 + orbChargeRatioB * 0.04,
                    0.995 + orbChargeRatioB * 0.03,
                  ],
                  y: [4, 0, -2],
                }}
                transition={{ duration: orbMotionB, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: orbColorsB.bottomCoronaGradient,
                  backgroundPosition: "center bottom",
                  filter: "blur(1.8px)",
                  transformOrigin: "50% 50%",
                }}
              />
            )}

            {orbChargeB > 12 && (
              <div className="absolute inset-[10%] rounded-full overflow-hidden pointer-events-none">
                {ORB_FLAME_TONGUES.map((tongue) => (
                  <motion.div
                    key={tongue.id}
                    className={`absolute rounded-full ${tongue.className}`}
                    style={{
                      background: orbColorsB.rimGlowGradient,
                      filter: "blur(0.6px)",
                      transformOrigin: "50% 100%",
                    }}
                    animate={{
                      opacity: [
                        0.12 + orbChargeRatioB * 0.42,
                        0.18 + orbChargeRatioB * 0.7,
                        0.14 + orbChargeRatioB * 0.55,
                      ],
                      scale: [
                        0.7 + orbChargeRatioB * (orbChargeB >= 70 ? 0.36 : 0.24),
                        0.76 + orbChargeRatioB * (orbChargeB >= 70 ? 0.48 : 0.3),
                        0.72 + orbChargeRatioB * (orbChargeB >= 70 ? 0.4 : 0.26),
                      ],
                      y: [3, -1, 1],
                      rotate: [-4, 4, -2],
                    }}
                    transition={{
                      duration: orbMotionB,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: parseFloat(tongue.delay),
                    }}
                  />
                ))}
              </div>
            )}

            <motion.div
              className="absolute inset-0 rounded-full border border-[#ea580c]/20 shadow-inner overflow-hidden"
              animate={{ scale: orbPulseB ? 1 : 1 }}
              aria-hidden
            >
              <div className="absolute inset-0 rounded-full bg-[#081224]" />

              <motion.div
                className="absolute inset-[8%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsB.coreGradient,
                  filter: "blur(1.5px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  scale: 0.78 + orbChargeRatioB * 0.2,
                  opacity: 0.15 + Math.min(0.85, orbChargeRatioB),
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />

              <motion.div
                className="absolute inset-[14%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsB.coreGradient,
                  filter: "blur(2px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  opacity: Math.max(0, Math.min(0.9, orbChargeRatioB * 1.1)),
                  scale: 0.9 + orbChargeRatioB * 0.15,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />

              <motion.div
                className="absolute inset-[16%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsB.highGlow,
                  filter: "blur(1.2px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  opacity:
                    orbChargeB > 45
                      ? 0.2 + Math.min(0.66, orbChargeRatioB)
                      : 0,
                  scale: 0.9 + orbChargeRatioB * 0.12,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />

              {orbChargeB > 10 && (
                <div className="absolute inset-0 pointer-events-none">
                  {ORB_INNER_FLAMES.map((flame) => (
                    <motion.div
                      key={flame.id}
                      className={`absolute rounded-full ${flame.className}`}
                      style={{
                        background: orbColorsB.flameGradient,
                        filter: "blur(0.9px)",
                        transformOrigin: "50% 100%",
                      }}
                      animate={{
                        opacity: [
                          0.18 + orbChargeRatioB * 0.46,
                          0.28 + orbChargeRatioB * 0.62,
                          0.2 + orbChargeRatioB * 0.52,
                        ],
                        scale: [
                          0.6 + orbChargeRatioB * (orbChargeB >= 70 ? 0.42 : 0.28),
                          0.66 + orbChargeRatioB * (orbChargeB >= 70 ? 0.52 : 0.34),
                          0.62 + orbChargeRatioB * (orbChargeB >= 70 ? 0.46 : 0.3),
                        ],
                        y: [4, -1, 2],
                        rotate: [-2, 2, 0],
                      }}
                      transition={{
                        duration: orbMotionB,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: parseFloat(flame.delay),
                      }}
                    />
                  ))}
                </div>
              )}

              <motion.div
                className="absolute left-0 right-0 bottom-0 rounded-b-full"
                animate={{ height: `${orbChargeB}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                style={{
                  background: orbColorsB.fillGradient,
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Header Topic & Turn Indicator */}
      <AnimatePresence>
        {!isIntroPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center mb-8 border-b-2 border-arena-border pb-4 relative transition-all duration-300 ${
              modalOpen ? "opacity-60 blur-[1px]" : "opacity-100"
            }`}
          >
            <h2 className="text-xl text-gray-400">CURRENT DEBATE:</h2>
            <h1 className="text-3xl text-arena-text font-bold uppercase">
              {topic}
            </h1>
            {status === "debating" && turnCount > 0 && (
              <div className="absolute right-0 top-0 text-arena-blue font-bold text-2xl border-2 border-arena-blue px-3 py-1">
                TURN {turnCount}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MOVED DOWN: The Stage (Fighters) */}
      <AnimatePresence>
        {activeCamera === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`flex items-start justify-between w-full h-full relative transition-all duration-300 ${
              modalOpen ? "opacity-60 blur-[1px]" : "opacity-100"
            }`}
          >
            <div className="translate-y-48">
              <FighterSprite
                fighter={fighterA}
                isActive={isASpeaking}
                facing="right"
                hp={hpA}
                currentIntent={currentIntent}
                isIntroPlaying={isIntroPlaying}
                isBeingAttacked={isBSpeaking && isAttack}
                verdict={verdict}
                userVote={userVote}
              />
            </div>

            {/* Dialogue for the Left */}
            {!isIntroPlaying && !isComplete && isASpeaking && (
              <div className="absolute left-[8%] top-4 z-70 w-[62%]">
                <DialogueBox
                  speakerName={fighterA.name}
                  rawText={rawText}
                  isJudge={isJudge}
                  onTypingComplete={() => {
                    if (visualTurnIndex < networkTurns.length - 1) {
                      if (advanceTimerRef.current) {
                        clearTimeout(advanceTimerRef.current);
                      }

                      advanceTimerRef.current = setTimeout(() => {
                        advanceVisualTurn();
                        advanceTimerRef.current = null;
                      }, 1500);
                    }
                  }}
                  speakerSide="left"
                />
              </div>
            )}

            {/* Dialogue for the Right */}
            {!isIntroPlaying && !isComplete && isBSpeaking && (
              <div className="absolute right-[8%] top-4 z-70 w-[62%]">
                <DialogueBox
                  speakerName={fighterB.name}
                  rawText={rawText}
                  isJudge={isJudge}
                  onTypingComplete={() => {
                    if (visualTurnIndex < networkTurns.length - 1) {
                      if (advanceTimerRef.current) {
                        clearTimeout(advanceTimerRef.current);
                      }

                      advanceTimerRef.current = setTimeout(() => {
                        advanceVisualTurn();
                        advanceTimerRef.current = null;
                      }, 1500);
                    }
                  }}
                  speakerSide="right"
                />
              </div>
            )}

            {/* Dialogue for the Judge */}
            {!isIntroPlaying && !isComplete && isJudge && (
              <div className="absolute left-1/2 top-4 z-70 w-[70%] -translate-x-1/2">
                <DialogueBox
                  speakerName="THE JUDGE"
                  rawText={rawText}
                  isJudge={isJudge}
                  onTypingComplete={() => {
                    if (visualTurnIndex < networkTurns.length - 1) {
                      if (advanceTimerRef.current) {
                        clearTimeout(advanceTimerRef.current);
                      }

                      advanceTimerRef.current = setTimeout(() => {
                        advanceVisualTurn();
                        advanceTimerRef.current = null;
                      }, 1500);
                    }
                  }}
                  speakerSide="right"
                />
              </div>
            )}

            {/* VS or Judge Graphic */}
            <div className="absolute inset-0 z-50 pointer-events-none">
              {/* The Judge's Descent */}
              <AnimatePresence>
                {status === "judging" && (
                  <motion.div
                    initial={{ y: -500, opacity: 0, scale: 2 }}
                    animate={{ y: -50, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", damping: 12, stiffness: 50 }}
                    className="absolute left-1/2 bottom-32 -translate-x-1/2 flex flex-col items-center z-40 pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                      }}
                      className="text-9xl drop-shadow-[0_0_30px_rgba(253,186,116,0.75)] mb-6"
                    >
                      ⚖️
                    </motion.div>
                    <h2 className="text-3xl text-white font-black tracking-[0.5em] uppercase drop-shadow-lg">
                      SILENCE
                    </h2>
                    <p className="text-xl text-yellow-500 tracking-widest mt-2 animate-pulse">
                      THE JUDGE IS DELIBERATING
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {status === "debating" && (
                <h1 className="text-6xl text-arena-red italic font-bold drop-shadow-[0_0_30px_rgba(255,60,60,1)] absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                  VS
                </h1>
              )}
            </div>

            <div className="translate-y-48">
              <FighterSprite
                fighter={fighterB}
                isActive={isBSpeaking}
                facing="left"
                hp={hpB}
                currentIntent={currentIntent}
                isIntroPlaying={isIntroPlaying}
                isBeingAttacked={isASpeaking && isAttack}
                verdict={verdict}
                userVote={userVote}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-Down View Dialogue Box */}
      <AnimatePresence>
        {activeCamera === "topDown" &&
          !isIntroPlaying &&
          status === "debating" && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl z-30"
            >
              <DialogueBox
                speakerName={speakerName}
                rawText={rawText}
                isJudge={false}
                onTypingComplete={() => {
                  if (visualTurnIndex < networkTurns.length - 1) {
                    setTimeout(advanceVisualTurn, 1500);
                  }
                }}
                speakerSide="left"
              />
            </motion.div>
          )}
      </AnimatePresence>

      {isComplete && showVerdictModal && verdict && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-md"
        >
          <div className="w-full max-w-5xl bg-gray-900 border-4 border-yellow-500 p-10 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-y-auto max-h-[90vh]">
            {!userVote && showVotePrompt ? (
              <div className="flex flex-col items-center py-2 md:py-6">
                <h2 className="text-3xl md:text-4xl text-arena-text mb-2 tracking-widest uppercase text-center">
                  THE DEBATE HAS CONCLUDED
                </h2>
                <p className="text-xl text-yellow-500 mb-8 animate-pulse text-center">
                  WHO WON? CAST YOUR VOTE.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <motion.button
                    type="button"
                    onClick={() => setUserVote(fighterA.id)}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`px-8 py-6 border-[6px] ${fighterABorderClass} bg-neutral-900 hover:bg-neutral-800 transition-colors flex flex-col items-center w-full`}
                  >
                    <img
                      src={fighterA.animations.idle}
                      alt={fighterA.name}
                      className="w-24 h-24 object-cover mb-2 pixelated shadow-2xl border-2 border-gray-800"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span className="text-xl font-bold uppercase">
                      {fighterA.name}
                    </span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setUserVote(fighterB.id)}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`px-8 py-6 border-[6px] ${fighterBBorderClass} bg-neutral-900 hover:bg-neutral-800 transition-colors flex flex-col items-center w-full`}
                  >
                    <img
                      src={fighterB.animations.idle}
                      alt={fighterB.name}
                      className="w-24 h-24 object-cover mb-2 pixelated shadow-2xl border-2 border-gray-800"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span className="text-xl font-bold uppercase">
                      {fighterB.name}
                    </span>
                  </motion.button>
                </div>
              </div>
            ) : userVote ? (
              <>
                <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center border-b-2 border-yellow-500/30 pb-4 mb-6">
                  <h2 className="text-3xl md:text-4xl text-yellow-500 text-center grow uppercase">
                    Winner: {winnerName}
                  </h2>
                  <div
                    className={`px-4 py-2 border-2 uppercase font-bold ${userVote === verdict.winner_id ? "border-arena-green text-arena-green" : "border-arena-red text-arena-red"}`}
                  >
                    {userVote === verdict.winner_id
                      ? "YOU AGREED"
                      : "JUDGE DISAGREES"}
                  </div>
                </div>

                <p className="text-xl md:text-2xl mb-8 leading-relaxed text-center font-bold">
                  "{verdict.punchline_reasoning}"
                </p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div
                    className={`p-4 border-2 ${verdict.winner_id === fighterA.id ? "border-arena-green" : "border-arena-red"}`}
                  >
                    <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                      {fighterA.name} Critique:
                    </h3>
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {verdict.fighter_a_critique}
                    </p>
                  </div>
                  <div
                    className={`p-4 border-2 ${verdict.winner_id === fighterB.id ? "border-arena-green" : "border-arena-red"}`}
                  >
                    <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                      {fighterB.name} Critique:
                    </h3>
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {verdict.fighter_b_critique}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowVerdictModal(false)}
                    className="px-6 py-3 border-2 border-gray-400 text-gray-300 hover:text-white hover:border-white transition-colors uppercase"
                  >
                    CLOSE & REVIEW DEBATE
                  </button>
                  <button
                    type="button"
                    onClick={onRestart}
                    className="px-6 py-3 border-2 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-white transition-colors font-bold uppercase"
                  >
                    START NEW DUEL
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      )}

      {isComplete && !showVerdictModal && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md overflow-hidden">
          {/* Sticky Header */}
          <div className="flex justify-between items-center px-10 py-6 border-b-4 border-gray-800 bg-black/90 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <div>
              <h2 className="text-3xl text-gray-400 uppercase tracking-widest font-black">
                DEBATE TRANSCRIPT
              </h2>
              <p className="text-lg text-gray-500 mt-1">Topic: {topic}</p>
            </div>
            <button
              type="button"
              onClick={onRestart}
              className="px-8 py-4 border-4 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-black transition-all text-xl font-bold tracking-widest"
            >
              START NEW DUEL
            </button>
          </div>

          {/* Scrollable Timeline Area */}
          <div className="flex-1 overflow-y-auto p-10 relative">
            {/* The Center Spine */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gray-800 opacity-50 z-0" />

            <div className="flex flex-col gap-16 max-w-5xl mx-auto relative z-10 py-10">
              {networkTurns.map((turn, index) => {
                const isFighterA = turn.speaker_id === fighterAId;
                const speakerName = isFighterA ? fighterA.name : fighterB.name;
                const borderColor = isFighterA
                  ? fighterA.color.replace("bg-", "border-")
                  : fighterB.color.replace("bg-", "border-");
                const textColor = isFighterA
                  ? fighterA.color.replace("bg-", "text-")
                  : fighterB.color.replace("bg-", "text-");

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={turn.id}
                    className={`flex w-full relative ${isFighterA ? "justify-start" : "justify-end"}`}
                  >
                    {/* The Timeline Node (Dot on the center spine) */}
                    <div
                      className="absolute left-1/2 top-8 -translate-x-1/2 w-6 h-6 rounded-full bg-black border-4 z-20 shadow-[0_0_15px_rgba(0,0,0,1)]"
                      style={{
                        borderColor: isFighterA ? "#3c82ff" : "#ff3c3c",
                      }}
                    />

                    {/* The Argument Card */}
                    <div
                      className={`w-[45%] flex flex-col ${isFighterA ? "items-end text-right" : "items-start text-left"}`}
                    >
                      {/* Metadata */}
                      <div
                        className={`text-sm font-mono tracking-widest uppercase mb-2 ${textColor} flex items-center gap-3`}
                      >
                        {isFighterA && (
                          <span className="opacity-50">[{turn.intent}]</span>
                        )}
                        <span className="font-bold text-xl">{speakerName}</span>
                        {!isFighterA && (
                          <span className="opacity-50">[{turn.intent}]</span>
                        )}
                      </div>

                      {/* Text Body */}
                      <div
                        className={`text-xl leading-relaxed text-gray-200 p-8 bg-gray-900/80 backdrop-blur-sm border-t-4 shadow-2xl ${borderColor}`}
                      >
                        {turn.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* The Final Verdict Node */}
              {verdict && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="flex flex-col items-center w-full relative z-10 mt-10"
                >
                  {/* The Judge's Node (Golden Dot) */}
                  <div className="absolute left-1/2 -top-8 -translate-x-1/2 w-8 h-8 rounded-full bg-black border-4 z-20 shadow-[0_0_20px_rgba(234,179,8,1)] flex items-center justify-center text-xs border-yellow-500">
                    ⚖️
                  </div>

                  {/* The Verdict Card */}
                  <div className="w-full max-w-4xl flex flex-col items-center bg-gray-900 border-4 border-yellow-500 p-10 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                    <h3 className="text-xl font-mono tracking-widest uppercase text-yellow-500 mb-6 flex items-center gap-4">
                      <span className="w-12 h-px bg-yellow-500/50"></span>
                      FINAL JUDGMENT
                      <span className="w-12 h-px bg-yellow-500/50"></span>
                    </h3>

                    <h2 className="text-4xl font-black text-white text-center mb-8 drop-shadow-lg">
                      WINNER:{" "}
                      <span className="text-yellow-500">
                        {ROSTER.find((f) => f.id === verdict.winner_id)?.name}
                      </span>
                    </h2>

                    <p className="text-2xl text-center leading-relaxed text-gray-200 italic mb-10 border-b-2 border-yellow-500/20 pb-10">
                      "{verdict.punchline_reasoning}"
                    </p>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                      <div
                        className={`p-6 border-l-4 ${verdict.winner_id === fighterAId ? "border-arena-green" : "border-arena-red"} bg-black/50`}
                      >
                        <h4 className="text-sm font-mono text-gray-400 uppercase mb-3">
                          CRITIQUE: {fighterA.name}
                        </h4>
                        <p className="text-lg text-gray-300 leading-relaxed">
                          {verdict.fighter_a_critique}
                        </p>
                      </div>
                      <div
                        className={`p-6 border-l-4 ${verdict.winner_id === fighterBId ? "border-arena-green" : "border-arena-red"} bg-black/50`}
                      >
                        <h4 className="text-sm font-mono text-gray-400 uppercase mb-3">
                          CRITIQUE: {fighterB.name}
                        </h4>
                        <p className="text-lg text-gray-300 leading-relaxed">
                          {verdict.fighter_b_critique}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Catastrophic Error Overlay */}
      {status === "error" && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm border-4 border-arena-red">
          <h1 className="text-6xl text-arena-red font-bold mb-6 tracking-widest uppercase animate-pulse">
            CONNECTION LOST
          </h1>
          <p className="text-2xl text-gray-300 mb-10 max-w-lg text-center">
            {errorMessage ??
              "The neural link to the Arena Engine has been severed. The debate cannot continue."}
          </p>
          <button
            type="button"
            onClick={onRestart}
            className="px-8 py-4 border-4 border-arena-red text-arena-red hover:bg-arena-red hover:text-black transition-colors font-bold text-2xl uppercase"
          >
            ABORT MATCH
          </button>
        </div>
      )}
    </motion.div>
  );
}
