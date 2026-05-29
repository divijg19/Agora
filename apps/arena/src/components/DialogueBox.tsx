import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useTypewriter } from "../hooks/useTypewriter";

interface DialogueBoxProps {
  speakerName: string | null;
  rawText: string;
  isJudge?: boolean;
  onTypingComplete?: () => void;
  speakerSide: "left" | "right";
}

function DialogueTail({
  speakerSide,
  isJudge,
}: {
  speakerSide: "left" | "right";
  isJudge: boolean;
}) {
  const clipId = `dialogue-tail-clip-${speakerSide}-${isJudge ? "judge" : "speaker"}`;
  const bladeFill = isJudge ? "#5b4300" : "#171717";
  const bladeHighlight = isJudge ? "#fff1a8" : "#f5f5f5";
  const sheenStops = isJudge
    ? [
        "rgba(255, 248, 197, 0)",
        "rgba(255, 248, 197, 0.65)",
        "rgba(255, 248, 197, 0)",
      ]
    : [
        "rgba(255, 255, 255, 0)",
        "rgba(255, 255, 255, 0.65)",
        "rgba(255, 255, 255, 0)",
      ];

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 48 36"
      className={`pointer-events-none absolute top-3 h-10 w-12 drop-shadow-[0_0_14px_rgba(0,0,0,0.6)] ${
        speakerSide === "left"
          ? "left-0 translate-x-[-92%]"
          : "right-0 translate-x-[92%]"
      } ${speakerSide === "right" ? "scale-x-[-1]" : ""}`}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <defs>
        <clipPath id={clipId}>
          <polygon points="42,8 42,28 14,28 4,18 14,8" />
        </clipPath>
        <linearGradient
          id={`${clipId}-sheen`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={sheenStops[0]} />
          <stop offset="35%" stopColor={sheenStops[0]} />
          <stop offset="50%" stopColor={sheenStops[1]} />
          <stop offset="65%" stopColor={sheenStops[0]} />
          <stop offset="100%" stopColor={sheenStops[2]} />
        </linearGradient>
      </defs>
      <polygon points="42,8 42,28 14,28 4,18 14,8" fill={bladeFill} />
      <g clipPath={`url(#${clipId})`}>
        <motion.rect
          x="-12"
          y="6"
          width="14"
          height="24"
          fill={`url(#${clipId}-sheen)`}
          animate={{ x: [-12, 26, 48] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </g>
      <path
        d="M25 18L34 11L40 18L34 25Z"
        fill={bladeHighlight}
        opacity="0.26"
      />
      <path
        d="M13 18H40"
        stroke={bladeHighlight}
        strokeLinecap="round"
        strokeWidth="1.8"
        opacity="0.95"
      />
    </motion.svg>
  );
}

export function DialogueBox({
  speakerName,
  rawText,
  isJudge = false,
  onTypingComplete,
  speakerSide,
}: DialogueBoxProps) {
  const { displayedText, isTyping } = useTypewriter(rawText, 20);

  useEffect(() => {
    if (!isTyping && displayedText === rawText && rawText.length > 0) {
      onTypingComplete?.();
    }
  }, [isTyping, displayedText, rawText, onTypingComplete]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${speakerName || "empty"}-${speakerSide}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative overflow-visible border-4 pl-6 pr-6 py-2 bg-black/70 min-h-30 ${
          isJudge ? "border-yellow-500" : "border-arena-border"
        } ${speakerSide === "left" ? "rounded-r-xl" : "rounded-l-xl"}`}
      >
        <DialogueTail speakerSide={speakerSide} isJudge={isJudge} />

        {/* Speaker Badge (UI Font - Monospace) */}
        <div
          className={`text-lg font-bold uppercase tracking-widest mb-3 font-mono ${
            isJudge ? "text-yellow-500" : "text-gray-500"
          }`}
        >
          {speakerName
            ? `>> ${speakerName} TRANSMITTING...`
            : ">> AWAITING NEURAL LINK..."}
        </div>

        {/* The Argument Text (Modern Font - Sans Serif, Reduced Size) */}
        <div
          className={`text-xl leading-relaxed font-sans font-normal tracking-wide ${
            isJudge ? "text-yellow-100" : "text-gray-200"
          }`}
        >
          {displayedText}

          {/* Elegant Cursor */}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className={`inline-block w-2 h-6 ml-2 align-middle ${
              isJudge ? "bg-yellow-500" : "bg-white"
            }`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
