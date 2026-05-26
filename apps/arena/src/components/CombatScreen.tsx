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

  // Color interpolation helper: blue (210deg) -> orange (28deg)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const lerpColor = (
    c1: [number, number, number],
    c2: [number, number, number],
    t: number,
  ) => {
    const r = Math.round(lerp(c1[0], c2[0], t));
    const g = Math.round(lerp(c1[1], c2[1], t));
    const b = Math.round(lerp(c1[2], c2[2], t));
    return [r, g, b] as [number, number, number];
  };

  const rgba = (rgb: [number, number, number], a = 1) =>
    `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

  // Only use blue and orange palettes (and white). Each palette has matching stops.
  const BLUE_STOPS: [number, number, number][] = [
    [191, 219, 254],
    [96, 165, 250],
    [59, 130, 246],
    [37, 99, 235],
  ];
  const ORANGE_STOPS: [number, number, number][] = [
    [255, 236, 209],
    [255, 179, 92],
    [255, 125, 50],
    [200, 70, 20],
  ];

  const colorsForCharge = (charge: number) => {
    // Blue until 70% (no orange influence), then interpolate to orange between 70-99%,
    // white-hot at 100% (core white, flames orange).
    const clamped = Math.max(0, Math.min(100, charge));
    const whiteHot = clamped >= 100;

    let s0: [number, number, number];
    let s1: [number, number, number];
    let s2: [number, number, number];
    let s3: [number, number, number];

    if (whiteHot) {
      // full orange palette for flames, but core will be white
      s0 = ORANGE_STOPS[0];
      s1 = ORANGE_STOPS[1];
      s2 = ORANGE_STOPS[2];
      s3 = ORANGE_STOPS[3];
    } else if (clamped <= 70) {
      // pure blue palette
      s0 = BLUE_STOPS[0];
      s1 = BLUE_STOPS[1];
      s2 = BLUE_STOPS[2];
      s3 = BLUE_STOPS[3];
    } else {
      // interpolate from blue -> orange over 70..100
      const t = (clamped - 70) / 30;
      s0 = lerpColor(BLUE_STOPS[0], ORANGE_STOPS[0], t);
      s1 = lerpColor(BLUE_STOPS[1], ORANGE_STOPS[1], t);
      s2 = lerpColor(BLUE_STOPS[2], ORANGE_STOPS[2], t);
      s3 = lerpColor(BLUE_STOPS[3], ORANGE_STOPS[3], t);
    }

    // Core: white-hot at 100% centers, otherwise blended stops (center slightly lighter)
    const coreCenter: [number, number, number] = whiteHot
      ? [255, 255, 255]
      : [255, 255, 255];
    const coreGradient = `radial-gradient(circle at 50% 45%, ${rgba(coreCenter, whiteHot ? 1 : 0.95)} 0%, ${rgba(s0, 0.95)} 12%, ${rgba(s1, 0.78)} 32%, ${rgba(s2, 0.28)} 58%, transparent 76%)`;

    // Corona should reflect the flame palette (orange when hot)
    const coronaGradient = `conic-gradient(from 0deg, ${rgba(s1, 0)} 0deg, ${rgba(s0, 0.55)} 45deg, ${rgba([255, 255, 255], 0.95)} 80deg, ${rgba(s1, 0.12)} 120deg, ${rgba(s2, 0.55)} 200deg, ${rgba([255, 255, 255], 0.85)} 260deg, ${rgba(s1, 0)} 360deg)`;

    // Tongues and fill use same palette
    const tongueGradient = `linear-gradient(to top, ${rgba([255, 255, 255], 0.95)} 0%, ${rgba(s0, 0.85)} 18%, ${rgba(s1, 0.5)} 42%, transparent 100%)`;
    const fillGradient = `linear-gradient(180deg, ${rgba(s0, 0.98)} 0%, ${rgba(s1, 0.95)} 24%, ${rgba(s2, 0.9)} 64%, ${rgba(s3, 0.98)} 100%)`;

    return {
      coreGradient,
      coronaGradient,
      tongueGradient,
      fillGradient,
      whiteHot,
    };
  };

  const orbColorsA = colorsForCharge(orbChargeA);
  const orbColorsB = colorsForCharge(orbChargeB);

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
            className="w-7 h-7 rounded-full border border-white/10 shadow-inner overflow-hidden relative"
            animate={{ scale: orbPulseA ? 1.12 : 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.35,
            }}
            aria-hidden
          >
            <div className="absolute inset-0 rounded-full bg-[#081224]" />

            {/* Plasma core and heat bloom */}
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

            {/* Outer plasma corona */}
            <motion.div
              className="absolute inset-[-10%] rounded-full pointer-events-none"
              animate={{
                opacity: orbChargeA > 12 ? 0.18 + orbChargeRatioA * 0.75 : 0,
                scale: orbChargeA > 12 ? 0.96 + orbChargeRatioA * 0.14 : 0.92,
              }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{
                animation:
                  orbChargeA > 12
                    ? `plasma-orbit ${7 - orbChargeA / 28}s linear infinite`
                    : "none",
                background: orbColorsA.coronaGradient,
                filter: "blur(2.5px)",
                transformOrigin: "50% 50%",
              }}
            >
              <div className="absolute inset-[18%] rounded-full border border-white/30 shadow-[0_0_8px_rgba(191,219,254,0.6)]" />
            </motion.div>

            {/* Edge plasma tongues */}
            {orbChargeA > 20 && (
              <div className="absolute inset-0 pointer-events-none">
                {ORB_FLAME_TONGUES.map((tongue) => (
                  <motion.div
                    key={tongue.id}
                    className={`absolute rounded-full ${tongue.className}`}
                    style={{
                      background: orbColorsA.tongueGradient,
                      filter: "blur(0.5px)",
                      transformOrigin: "50% 100%",
                      transform: `scale(${0.8 + orbChargeRatioA * (orbChargeA >= 70 ? 1.8 : 1.2)})`,
                      animation: `plasma-flicker ${tongue.duration} ease-in-out infinite ${tongue.delay}, plasma-rise ${Math.max(1.15, 2.1 - orbChargeRatioA * 0.95)}s ease-in-out infinite ${tongue.delay}`,
                      opacity: Math.min(
                        1,
                        0.15 +
                          orbChargeRatioA * (orbChargeA >= 70 ? 1.15 : 0.95),
                      ),
                    }}
                  />
                ))}
              </div>
            )}

            {orbChargeA > 50 && (
              <motion.div
                className="absolute inset-[28%] rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(191,219,254,0.55) 30%, transparent 68%)",
                  filter: "blur(1px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  opacity: 0.35 + Math.min(0.65, orbChargeRatioA),
                  scale: 0.9 + orbChargeRatioA * 0.1,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            )}

            {/* Blue core fill */}
            <motion.div
              className="absolute left-0 right-0 bottom-0 rounded-b-full"
              animate={{ height: `${orbChargeA}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              style={{
                background: orbColorsA.fillGradient,
              }}
            />

            {orbChargeA > 75 && (
              <motion.div
                className="absolute inset-[18%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsA.whiteHot
                    ? "radial-gradient(circle at 50% 42%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 12%, rgba(255,255,255,0.4) 22%, transparent 72%)"
                    : `radial-gradient(circle at 50% 42%, rgba(255,255,255,0.98) 0%, hsla(${Math.round(lerp(210, 28, orbChargeRatioA))},85%,80%,0.65) 18%, hsla(${Math.round(lerp(210, 28, orbChargeRatioA))},80%,60%,0.28) 35%, transparent 72%)`,
                  mixBlendMode: "screen",
                  filter: "blur(0.75px)",
                }}
                animate={{
                  opacity: 0.7 + Math.min(0.3, orbChargeRatioA),
                  scale: 1.0 + orbChargeRatioA * 0.08,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}

            {/* Inner Shine Overlay */}
            <div className="absolute inset-0 rounded-full bg-white/6 pointer-events-none" />
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
            className="w-7 h-7 rounded-full border border-white/10 shadow-inner overflow-hidden relative"
            animate={{ scale: orbPulseB ? 1.12 : 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.35,
            }}
            aria-hidden
          >
            <div className="absolute inset-0 rounded-full bg-[#081224]" />

            {/* Enhanced Glow Layer - Multiple concentric gradients */}
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
              className="absolute inset-[-10%] rounded-full pointer-events-none"
              animate={{
                opacity: orbChargeB > 12 ? 0.18 + orbChargeRatioB * 0.75 : 0,
                scale: orbChargeB > 12 ? 0.96 + orbChargeRatioB * 0.14 : 0.92,
              }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{
                animation:
                  orbChargeB > 12
                    ? `plasma-orbit ${7 - orbChargeB / 28}s linear infinite`
                    : "none",
                background: orbColorsB.coronaGradient,
                filter: "blur(2.5px)",
                transformOrigin: "50% 50%",
              }}
            >
              <div className="absolute inset-[18%] rounded-full border border-white/30 shadow-[0_0_8px_rgba(191,219,254,0.6)]" />
            </motion.div>

            {orbChargeB > 20 && (
              <div className="absolute inset-0 pointer-events-none">
                {ORB_FLAME_TONGUES.map((tongue) => (
                  <motion.div
                    key={tongue.id}
                    className={`absolute rounded-full ${tongue.className}`}
                    style={{
                      background: orbColorsB.tongueGradient,
                      filter: "blur(0.5px)",
                      transformOrigin: "50% 100%",
                      transform: `scale(${0.8 + orbChargeRatioB * (orbChargeB >= 70 ? 1.8 : 1.2)})`,
                      animation: `plasma-flicker ${tongue.duration} ease-in-out infinite ${tongue.delay}, plasma-rise ${Math.max(1.15, 2.1 - orbChargeRatioB * 0.95)}s ease-in-out infinite ${tongue.delay}`,
                      opacity: Math.min(
                        1,
                        0.15 +
                          orbChargeRatioB * (orbChargeB >= 70 ? 1.15 : 0.95),
                      ),
                    }}
                  />
                ))}
              </div>
            )}

            {orbChargeB > 50 && (
              <motion.div
                className="absolute inset-[28%] rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(191,219,254,0.55) 30%, transparent 68%)",
                  filter: "blur(1px)",
                  mixBlendMode: "screen",
                }}
                animate={{
                  opacity: 0.35 + Math.min(0.65, orbChargeRatioB),
                  scale: 0.9 + orbChargeRatioB * 0.1,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            )}

            <motion.div
              className="absolute left-0 right-0 bottom-0 rounded-b-full"
              animate={{ height: `${orbChargeB}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              style={{
                background: orbColorsB.fillGradient,
              }}
            />

            {orbChargeB > 75 && (
              <motion.div
                className="absolute inset-[18%] rounded-full pointer-events-none"
                style={{
                  background: orbColorsB.whiteHot
                    ? "radial-gradient(circle at 50% 42%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 12%, rgba(255,255,255,0.4) 22%, transparent 72%)"
                    : `radial-gradient(circle at 50% 42%, rgba(255,255,255,0.98) 0%, hsla(${Math.round(lerp(210, 28, orbChargeRatioB))},85%,80%,0.65) 18%, hsla(${Math.round(lerp(210, 28, orbChargeRatioB))},80%,60%,0.28) 35%, transparent 72%)`,
                  mixBlendMode: "screen",
                  filter: "blur(0.75px)",
                }}
                animate={{
                  opacity: 0.7 + Math.min(0.3, orbChargeRatioB),
                  scale: 1.0 + orbChargeRatioB * 0.08,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}

            {/* Inner Shine Overlay */}
            <div className="absolute inset-0 rounded-full bg-white/6 pointer-events-none" />
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
                      className="text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] mb-6"
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
