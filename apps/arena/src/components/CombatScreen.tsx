import { AnimatePresence, motion } from "framer-motion";
import { Info, Pause } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEngineStream } from "../hooks/useEngineStream";
import { useViewportHeight } from "../hooks/useViewportHeight.ts";
import { getCombatGroundYPixels } from "../lib/spritePositioning";
import type { FighterDef } from "../types/fighter";
import { CombatParallaxBackground } from "./CombatParallaxBackground";
import { DialogueBox } from "./DialogueBox";
import { FighterSprite } from "./FighterSprite";
import { ModeToggle } from "./ModeToggle";

interface CombatScreenProps {
  matchId: string;
  topic: string;
  fighterA: FighterDef;
  fighterB: FighterDef;
  debateMode: "manual" | "auto";
  onUpdateDebateMode?: (mode: "manual" | "auto") => void;
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

const STAGE_PROGRESSION = [
  { speedMult: 1.0, opacityMult: 0.8, scaleMult: 0.9 }, // Stage 0 (0-10%)
  { speedMult: 1.02, opacityMult: 0.82, scaleMult: 0.92 }, // Stage 1 (10-20%)
  { speedMult: 1.04, opacityMult: 0.84, scaleMult: 0.94 }, // Stage 2 (20-30%)
  { speedMult: 1.06, opacityMult: 0.86, scaleMult: 0.96 }, // Stage 3 (30-40%)
  { speedMult: 1.08, opacityMult: 0.88, scaleMult: 0.98 }, // Stage 4 (40-50%)
  { speedMult: 1.1, opacityMult: 0.9, scaleMult: 1.0 }, // Stage 5 (50-60%)
  { speedMult: 1.12, opacityMult: 0.92, scaleMult: 1.02 }, // Stage 6 (60-70%)
  { speedMult: 1.14, opacityMult: 0.94, scaleMult: 1.04 }, // Stage 7 (70-80%)
  { speedMult: 1.16, opacityMult: 0.96, scaleMult: 1.06 }, // Stage 8 (80-90%)
  { speedMult: 1.18, opacityMult: 0.98, scaleMult: 1.08 }, // Stage 9 (90-100%)
  { speedMult: 1.2, opacityMult: 1.0, scaleMult: 1.1 }, // Stage 10 (100%)
];

function getVotePortraitFrame(fighter: FighterDef, isMirrored = false) {
  const spriteFolder = fighter.id.charAt(0).toUpperCase() + fighter.id.slice(1);
  const idleHeadshot =
    fighter.animations?.idle ??
    `/sprites/${spriteFolder}/${spriteFolder}_Idle.gif`;

  const isEconomist = fighter.id === "economist";
  const isDoomer = fighter.id === "doomer";

  const topOffset = isMirrored
    ? isEconomist
      ? "-40%"
      : "-60%"
    : isEconomist
      ? "-35%"
      : "-65%";

  const horizontalOffset = isMirrored
    ? isDoomer
      ? "2.0%"
      : isEconomist
        ? "-2.5%"
        : "-3.5%"
    : isDoomer
      ? "-2.0%"
      : isEconomist
        ? "2.5%"
        : "3.0%";

  return {
    idleHeadshot,
    topOffset,
    horizontalOffset,
    isMirrored,
  };
}

type EndgamePhase = "idle" | "deliberating" | "voting";

export function CombatScreen({
  matchId,
  topic,
  fighterA,
  fighterB,
  debateMode,
  onUpdateDebateMode,
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
  const [showJudgeDeliberating, setShowJudgeDeliberating] = useState(false);
  const [endgamePhase, setEndgamePhase] = useState<EndgamePhase>("idle");
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
  const hasRunEndgameSequenceRef = useRef(false);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const [manualReady, setManualReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInfoHovering, setIsInfoHovering] = useState(false);
  const viewportHeight = useViewportHeight();
  const hasBufferedTurnAhead = visualTurnIndex < networkTurns.length - 1;
  const isEndgameActive = endgamePhase !== "idle";
  const isComplete =
    status === "completed" &&
    verdict !== null &&
    !hasBufferedTurnAhead &&
    !isTyping;

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
    if (isPaused && advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, [isPaused]);

  useEffect(() => {
    if (!isComplete && !isEndgameActive) {
      return;
    }

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setManualReady(false);
  }, [isComplete, isEndgameActive]);

  useEffect(() => {
    if (!isTyping) {
      setActiveSpeakerVisual(currentSpeaker);
      setActiveIntentVisual(currentIntent);
    }
  }, [currentSpeaker, currentIntent]);

  useEffect(() => {
    if (!isInfoHovering) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        infoPanelRef.current &&
        !infoPanelRef.current.contains(e.target as Node)
      ) {
        setIsInfoHovering(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isInfoHovering]);

  useEffect(() => {
    if (status === "completed") {
      setShowVerdictModal(true);
      setShowVotePrompt(false);
      setUserVote(null);
    } else {
      setShowVotePrompt(false);
      setShowJudgeDeliberating(false);
      setEndgamePhase("idle");
      hasRunEndgameSequenceRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (!isComplete || hasRunEndgameSequenceRef.current) {
      return;
    }

    hasRunEndgameSequenceRef.current = true;
    setEndgamePhase("deliberating");
    setShowJudgeDeliberating(true);
    setShowVotePrompt(false);

    let voteTimer: ReturnType<typeof setTimeout> | null = null;
    const deliberationTimer = setTimeout(() => {
      setShowJudgeDeliberating(false);
      setEndgamePhase("voting");
      voteTimer = setTimeout(() => {
        setShowVotePrompt(true);
      }, 120);
    }, 2200);

    return () => {
      clearTimeout(deliberationTimer);
      if (voteTimer) {
        clearTimeout(voteTimer);
      }
    };
  }, [isComplete]);

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
  const modalOpen = isComplete && showVerdictModal;
  const fighterABorderClass = fighterA.color.replace("bg-", "border-");
  const fighterBBorderClass = fighterB.color.replace("bg-", "border-");
  const fighterAPortrait = getVotePortraitFrame(fighterA);
  const fighterBPortrait = getVotePortraitFrame(fighterB, true);
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
  const combatGroundYPixels = getCombatGroundYPixels(viewportHeight);
  const stageFighterPlacementStyle = {
    transform: `translateY(${combatGroundYPixels}px)`,
  };
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
  const showChevronA =
    !isEndgameActive ||
    (userVote !== null && verdict?.winner_id === fighterA.id);
  const showChevronB =
    !isEndgameActive ||
    (userVote !== null && verdict?.winner_id === fighterB.id);
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

  // Stage ladder for 10% animation bands
  const orbStageA = Math.min(10, Math.floor(orbChargeA / 10));
  const orbStageB = Math.min(10, Math.floor(orbChargeB / 10));
  const stageProg_A = STAGE_PROGRESSION[orbStageA];
  const stageProg_B = STAGE_PROGRESSION[orbStageB];
  const orbSpeedA = orbMotionA * stageProg_A.speedMult;
  const orbSpeedB = orbMotionB * stageProg_B.speedMult;

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

  // keep a ref of visualTurnIndex so callbacks don't need it as a dep
  const visualIndexRef = useRef(visualTurnIndex);
  useEffect(() => {
    visualIndexRef.current = visualTurnIndex;
  }, [visualTurnIndex]);

  const handleTypingComplete = useCallback(() => {
    if (isComplete || isEndgameActive) {
      return;
    }

    if (visualIndexRef.current < networkTurns.length - 1) {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      if (debateMode === "auto") {
        advanceTimerRef.current = setTimeout(() => {
          setManualReady(false);
          advanceVisualTurn();
          advanceTimerRef.current = null;
        }, 1500);
      } else {
        setManualReady(true);
      }
    }
  }, [
    networkTurns.length,
    advanceVisualTurn,
    debateMode,
    isComplete,
    isEndgameActive,
  ]);

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
                    (0.14 + orbChargeRatioA * 0.44) * stageProg_A.opacityMult,
                    (0.18 + orbChargeRatioA * 0.56) * stageProg_A.opacityMult,
                    (0.16 + orbChargeRatioA * 0.5) * stageProg_A.opacityMult,
                  ],
                  scaleX: [
                    (0.92 + orbChargeRatioA * 0.12) * stageProg_A.scaleMult,
                    (0.96 + orbChargeRatioA * 0.16) * stageProg_A.scaleMult,
                    (0.93 + orbChargeRatioA * 0.14) * stageProg_A.scaleMult,
                  ],
                  scaleY: [
                    (0.9 + orbChargeRatioA * 0.22) * stageProg_A.scaleMult,
                    (0.98 + orbChargeRatioA * 0.34) * stageProg_A.scaleMult,
                    (0.92 + orbChargeRatioA * 0.28) * stageProg_A.scaleMult,
                  ],
                  y: [0, -2, -1],
                }}
                transition={{
                  duration: orbSpeedA,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {orbChargeA > 12 && (
              <motion.div
                className="absolute inset-[12%] rounded-full overflow-hidden pointer-events-none"
                animate={{
                  opacity: [
                    (0.08 + orbChargeRatioA * 0.34) * stageProg_A.opacityMult,
                    (0.12 + orbChargeRatioA * 0.42) * stageProg_A.opacityMult,
                    (0.1 + orbChargeRatioA * 0.38) * stageProg_A.opacityMult,
                  ],
                  scale: [
                    (0.99 + orbChargeRatioA * 0.02) * stageProg_A.scaleMult,
                    (1.0 + orbChargeRatioA * 0.04) * stageProg_A.scaleMult,
                    (0.995 + orbChargeRatioA * 0.03) * stageProg_A.scaleMult,
                  ],
                  y: [4, 0, -2],
                }}
                transition={{
                  duration: orbSpeedA,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
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
                        (0.12 + orbChargeRatioA * 0.42) *
                          stageProg_A.opacityMult,
                        (0.18 + orbChargeRatioA * 0.7) *
                          stageProg_A.opacityMult,
                        (0.14 + orbChargeRatioA * 0.55) *
                          stageProg_A.opacityMult,
                      ],
                      scale: [
                        (0.7 +
                          orbChargeRatioA * (orbChargeA >= 70 ? 0.36 : 0.24)) *
                          stageProg_A.scaleMult,
                        (0.76 +
                          orbChargeRatioA * (orbChargeA >= 70 ? 0.48 : 0.3)) *
                          stageProg_A.scaleMult,
                        (0.72 +
                          orbChargeRatioA * (orbChargeA >= 70 ? 0.4 : 0.26)) *
                          stageProg_A.scaleMult,
                      ],
                      y: [3, -1, 1],
                      rotate: [-4, 4, -2],
                    }}
                    transition={{
                      duration: orbSpeedA,
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
                  scale: (0.78 + orbChargeRatioA * 0.2) * stageProg_A.scaleMult,
                  opacity:
                    (0.15 + Math.min(0.85, orbChargeRatioA)) *
                    stageProg_A.opacityMult,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />

              {/* Core layer 2 activates at stage 3 (30% charge) */}
              {orbStageA >= 3 && (
                <motion.div
                  className="absolute inset-[14%] rounded-full pointer-events-none"
                  style={{
                    background: orbColorsA.coreGradient,
                    filter: "blur(2px)",
                    mixBlendMode: "screen",
                  }}
                  animate={{
                    opacity:
                      Math.max(0, Math.min(0.9, orbChargeRatioA * 1.1)) *
                      stageProg_A.opacityMult,
                    scale:
                      (0.9 + orbChargeRatioA * 0.15) * stageProg_A.scaleMult,
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              )}

              {/* Core layer 3 & high glow activate at stage 6 (60% charge) */}
              {orbStageA >= 6 && (
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
                        ? (0.2 + Math.min(0.66, orbChargeRatioA)) *
                          stageProg_A.opacityMult
                        : 0,
                    scale:
                      (0.9 + orbChargeRatioA * 0.12) * stageProg_A.scaleMult,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}

              {/* Inner flame wisps emerge at 10% charge, intensity grows with stage */}
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
                          (0.18 + orbChargeRatioA * 0.46) *
                            stageProg_A.opacityMult,
                          (0.28 + orbChargeRatioA * 0.62) *
                            stageProg_A.opacityMult,
                          (0.2 + orbChargeRatioA * 0.52) *
                            stageProg_A.opacityMult,
                        ],
                        scale: [
                          (0.6 +
                            orbChargeRatioA *
                              (orbChargeA >= 70 ? 0.42 : 0.28)) *
                            stageProg_A.scaleMult,
                          (0.66 +
                            orbChargeRatioA *
                              (orbChargeA >= 70 ? 0.52 : 0.34)) *
                            stageProg_A.scaleMult,
                          (0.62 +
                            orbChargeRatioA * (orbChargeA >= 70 ? 0.46 : 0.3)) *
                            stageProg_A.scaleMult,
                        ],
                        y: [4, -1, 2],
                        rotate: [-2, 2, 0],
                      }}
                      transition={{
                        duration: orbSpeedA,
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
                {showChevronA ? (isAChevronDouble ? ">>" : ">") : ""}
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
                {showChevronB ? (isBChevronDouble ? "<<" : "<") : ""}
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
                    (0.14 + orbChargeRatioB * 0.44) * stageProg_B.opacityMult,
                    (0.18 + orbChargeRatioB * 0.56) * stageProg_B.opacityMult,
                    (0.16 + orbChargeRatioB * 0.5) * stageProg_B.opacityMult,
                  ],
                  scaleX: [
                    (0.92 + orbChargeRatioB * 0.12) * stageProg_B.scaleMult,
                    (0.96 + orbChargeRatioB * 0.16) * stageProg_B.scaleMult,
                    (0.93 + orbChargeRatioB * 0.14) * stageProg_B.scaleMult,
                  ],
                  scaleY: [
                    (0.9 + orbChargeRatioB * 0.22) * stageProg_B.scaleMult,
                    (0.98 + orbChargeRatioB * 0.34) * stageProg_B.scaleMult,
                    (0.92 + orbChargeRatioB * 0.28) * stageProg_B.scaleMult,
                  ],
                  y: [0, -2, -1],
                }}
                transition={{
                  duration: orbSpeedB,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {orbChargeB > 12 && (
              <motion.div
                className="absolute inset-[12%] rounded-full overflow-hidden pointer-events-none"
                animate={{
                  opacity: [
                    (0.08 + orbChargeRatioB * 0.34) * stageProg_B.opacityMult,
                    (0.12 + orbChargeRatioB * 0.42) * stageProg_B.opacityMult,
                    (0.1 + orbChargeRatioB * 0.38) * stageProg_B.opacityMult,
                  ],
                  scale: [
                    (0.99 + orbChargeRatioB * 0.02) * stageProg_B.scaleMult,
                    (1.0 + orbChargeRatioB * 0.04) * stageProg_B.scaleMult,
                    (0.995 + orbChargeRatioB * 0.03) * stageProg_B.scaleMult,
                  ],
                  y: [4, 0, -2],
                }}
                transition={{
                  duration: orbSpeedB,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
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
                        (0.12 + orbChargeRatioB * 0.42) *
                          stageProg_B.opacityMult,
                        (0.18 + orbChargeRatioB * 0.7) *
                          stageProg_B.opacityMult,
                        (0.14 + orbChargeRatioB * 0.55) *
                          stageProg_B.opacityMult,
                      ],
                      scale: [
                        (0.7 +
                          orbChargeRatioB * (orbChargeB >= 70 ? 0.36 : 0.24)) *
                          stageProg_B.scaleMult,
                        (0.76 +
                          orbChargeRatioB * (orbChargeB >= 70 ? 0.48 : 0.3)) *
                          stageProg_B.scaleMult,
                        (0.72 +
                          orbChargeRatioB * (orbChargeB >= 70 ? 0.4 : 0.26)) *
                          stageProg_B.scaleMult,
                      ],
                      y: [3, -1, 1],
                      rotate: [-4, 4, -2],
                    }}
                    transition={{
                      duration: orbSpeedB,
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
                  scale: (0.78 + orbChargeRatioB * 0.2) * stageProg_B.scaleMult,
                  opacity:
                    (0.15 + Math.min(0.85, orbChargeRatioB)) *
                    stageProg_B.opacityMult,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />

              {/* Core layer 2 activates at stage 3 (30% charge) */}
              {orbStageB >= 3 && (
                <motion.div
                  className="absolute inset-[14%] rounded-full pointer-events-none"
                  style={{
                    background: orbColorsB.coreGradient,
                    filter: "blur(2px)",
                    mixBlendMode: "screen",
                  }}
                  animate={{
                    opacity:
                      Math.max(0, Math.min(0.9, orbChargeRatioB * 1.1)) *
                      stageProg_B.opacityMult,
                    scale:
                      (0.9 + orbChargeRatioB * 0.15) * stageProg_B.scaleMult,
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              )}

              {/* Core layer 3 & high glow activate at stage 6 (60% charge) */}
              {orbStageB >= 6 && (
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
                        ? (0.2 + Math.min(0.66, orbChargeRatioB)) *
                          stageProg_B.opacityMult
                        : 0,
                    scale:
                      (0.9 + orbChargeRatioB * 0.12) * stageProg_B.scaleMult,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}

              {/* Inner flame wisps emerge at 10% charge, intensity grows with stage */}
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
                          (0.18 + orbChargeRatioB * 0.46) *
                            stageProg_B.opacityMult,
                          (0.28 + orbChargeRatioB * 0.62) *
                            stageProg_B.opacityMult,
                          (0.2 + orbChargeRatioB * 0.52) *
                            stageProg_B.opacityMult,
                        ],
                        scale: [
                          (0.6 +
                            orbChargeRatioB *
                              (orbChargeB >= 70 ? 0.42 : 0.28)) *
                            stageProg_B.scaleMult,
                          (0.66 +
                            orbChargeRatioB *
                              (orbChargeB >= 70 ? 0.52 : 0.34)) *
                            stageProg_B.scaleMult,
                          (0.62 +
                            orbChargeRatioB * (orbChargeB >= 70 ? 0.46 : 0.3)) *
                            stageProg_B.scaleMult,
                        ],
                        y: [4, -1, 2],
                        rotate: [-2, 2, 0],
                      }}
                      transition={{
                        duration: orbSpeedB,
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
            <div className="absolute right-0 top-0 flex items-center gap-3"></div>
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
            <div style={stageFighterPlacementStyle}>
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
              <div className="absolute left-[25%] top-[5%] z-70 w-[50%]">
                <DialogueBox
                  speakerName={fighterA.name}
                  rawText={rawText}
                  isJudge={isJudge}
                  onTypingComplete={handleTypingComplete}
                  speakerSide="left"
                />
              </div>
            )}

            {/* Dialogue for the Right */}
            {!isIntroPlaying && !isComplete && isBSpeaking && (
              <div className="absolute right-[25%] top-[5%] z-70 w-[50%]">
                <DialogueBox
                  speakerName={fighterB.name}
                  rawText={rawText}
                  isJudge={isJudge}
                  onTypingComplete={handleTypingComplete}
                  speakerSide="right"
                />
              </div>
            )}

            <div style={stageFighterPlacementStyle}>
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
                onTypingComplete={handleTypingComplete}
                speakerSide="left"
              />
            </motion.div>
          )}
      </AnimatePresence>

      {/* Bottom-center Info Button with Hover Settings Panel */}
      {!modalOpen && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-60">
          <div
            ref={infoPanelRef}
            onMouseEnter={() => setIsInfoHovering(true)}
            className="relative"
            role="none"
          >
            {/* Info/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="w-12 h-12 bg-black/60 border border-white/10 hover:bg-white/10 rounded-sm text-white font-bold text-xl transition-all flex items-center justify-center"
              aria-label={isPaused ? "Resume debate" : "Pause debate"}
            >
              {isPaused ? <Pause size={24} /> : <Info size={24} />}
            </button>

            {/* Hover Settings Panel */}
            {isInfoHovering && !isPaused && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/70 p-3 rounded-md border border-white/10 whitespace-nowrap">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs text-gray-300 uppercase font-mono">
                    Debate Mode
                  </span>
                </div>
                <ModeToggle
                  value={debateMode}
                  onChange={(m) => {
                    if (typeof onUpdateDebateMode === "function")
                      onUpdateDebateMode(m);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pause Overlay Menu */}
      {isPaused && !modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-70 bg-black/70 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setIsPaused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setIsPaused(false);
            }
          }}
          role="alertdialog"
          aria-modal="true"
          tabIndex={0}
        >
          <div
            className="bg-gray-900 border-4 border-white/20 p-10 rounded-md flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Pause menu"
          >
            <h2 className="text-4xl text-white font-black uppercase tracking-widest">
              DEBATE PAUSED
            </h2>

            <div className="w-full max-w-2xl grid gap-4 sm:grid-cols-[1fr_auto] items-start">
              <div className="flex flex-col gap-3 w-full sm:min-w-55">
                <button
                  type="button"
                  onClick={() => setIsPaused(false)}
                  className="px-6 py-3 bg-white text-black font-bold uppercase rounded-sm hover:bg-gray-200 transition-colors"
                >
                  RESUME
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="px-6 py-3 bg-arena-red/20 border border-arena-red text-arena-red font-bold uppercase rounded-sm hover:bg-arena-red hover:text-white transition-colors"
                >
                  RESTART
                </button>
              </div>

              <div className="w-full sm:w-55 bg-black/40 border border-white/10 rounded-sm p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs text-gray-300 uppercase font-mono">
                    Debate Mode
                  </span>
                </div>
                <ModeToggle
                  value={debateMode}
                  onChange={(m) => {
                    if (typeof onUpdateDebateMode === "function")
                      onUpdateDebateMode(m);
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom-right NEXT button for manual mode */}
      {!modalOpen &&
        !isComplete &&
        !isEndgameActive &&
        manualReady &&
        visualTurnIndex < networkTurns.length - 1 && (
          <div className="absolute bottom-6 right-6 z-60">
            <button
              type="button"
              onClick={() => {
                if (advanceTimerRef.current) {
                  clearTimeout(advanceTimerRef.current);
                  advanceTimerRef.current = null;
                }
                advanceVisualTurn();
                setManualReady(false);
              }}
              className="px-6 py-2 bg-white text-black font-bold uppercase rounded-sm border border-gray-300 shadow-lg min-w-24 text-center text-[1.05rem]"
            >
              NEXT
            </button>
          </div>
        )}

      {isComplete && showVerdictModal && verdict && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 z-90 flex items-center justify-center p-8 bg-black/80 backdrop-blur-md"
        >
          <div className="w-full max-w-5xl h-[90vh] bg-gray-900 border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-10">
              {!userVote && !showVotePrompt ? (
                <div className="min-h-full flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-8 flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        ease: "easeInOut",
                      }}
                      className="text-7xl md:text-8xl drop-shadow-[0_0_30px_rgba(253,186,116,0.75)]"
                    >
                      ⚖️
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl text-white font-black tracking-[0.45em] uppercase drop-shadow-lg">
                      SILENCE
                    </h2>
                  </div>

                  <div className="w-full max-w-3xl border-4 border-yellow-500/40 bg-black/30 p-8 md:p-10 shadow-[0_0_40px_rgba(234,179,8,0.12)]">
                    <h3 className="text-xl md:text-2xl text-yellow-500 uppercase tracking-[0.35em] mb-4">
                      THE JUDGE IS DELIBERATING
                    </h3>
                    <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl mx-auto">
                      Preparing the verdict and vote overlay.
                    </p>
                  </div>
                </div>
              ) : !userVote && showVotePrompt ? (
                <div className="flex min-h-full flex-col items-center justify-center py-2 md:py-6 text-center">
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
                      <div className="w-24 h-24 bg-gray-900 border-2 border-gray-700 relative overflow-hidden shrink-0 mb-2">
                        <img
                          src={fighterAPortrait.idleHeadshot}
                          alt={`${fighterA.name} idle headshot`}
                          className="absolute left-1/2 -translate-x-1/2 max-w-none object-contain pixelated"
                          style={{
                            imageRendering: "pixelated",
                            height: "400%",
                            top: fighterAPortrait.topOffset,
                            width: "auto",
                            transform: `translateX(${fighterAPortrait.horizontalOffset})${fighterAPortrait.isMirrored ? " scaleX(-1)" : ""}`,
                          }}
                        />
                      </div>
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
                      <div className="w-24 h-24 bg-gray-900 border-2 border-gray-700 relative overflow-hidden shrink-0 mb-2">
                        <img
                          src={fighterBPortrait.idleHeadshot}
                          alt={`${fighterB.name} idle headshot`}
                          className="absolute left-1/2 -translate-x-1/2 max-w-none object-contain pixelated"
                          style={{
                            imageRendering: "pixelated",
                            height: "400%",
                            top: fighterBPortrait.topOffset,
                            width: "auto",
                            transform: `translateX(${fighterBPortrait.horizontalOffset})${fighterBPortrait.isMirrored ? " scaleX(-1)" : ""}`,
                          }}
                        />
                      </div>
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
          </div>
        </motion.div>
      )}

      {isComplete && !showVerdictModal && (
        <div className="absolute inset-0 z-90 flex flex-col bg-black/95 backdrop-blur-md overflow-hidden">
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
        <div className="absolute inset-0 bg-black/80 z-95 flex flex-col items-center justify-center backdrop-blur-sm border-4 border-arena-red">
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

      {/* Dedicated Judge Overlay Layer above HUD and stage */}
      <div className="absolute inset-0 z-80 pointer-events-none">
        {/* Judge deliberation dialogue */}
        {!isIntroPlaying &&
          isComplete &&
          endgamePhase === "deliberating" &&
          showJudgeDeliberating && (
            <div className="absolute left-1/2 top-4 w-[70%] -translate-x-1/2">
              <DialogueBox
                speakerName="THE JUDGE"
                rawText="SILENCE. THE JUDGE IS DELIBERATING."
                isJudge
                onTypingComplete={() => {}}
                speakerSide="right"
              />
            </div>
          )}

        {/* Judge crest + text */}
        <AnimatePresence>
          {!isIntroPlaying &&
            isComplete &&
            endgamePhase === "deliberating" &&
            showJudgeDeliberating && (
              <motion.div
                initial={{ y: -500, opacity: 0, scale: 2 }}
                animate={{ y: -50, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 12, stiffness: 50 }}
                className="absolute left-1/2 bottom-32 -translate-x-1/2 flex flex-col items-center pointer-events-none"
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
      </div>
    </motion.div>
  );
}
