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
        className={`relative border-4 pl-6 pr-6 py-2 bg-black/70 min-h-30 ${
          isJudge ? "border-yellow-500" : "border-arena-border"
        } ${speakerSide === "left" ? "rounded-r-xl" : "rounded-l-xl"}`}
      >
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
