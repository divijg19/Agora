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
        } ${speakerSide === "left" ? "rounded-r-xl" : "rounded-l-xl"} ${
          speakerSide === "left"
            ? "before:content-[''] before:absolute before:-left-4 before:top-4 before:w-0 before:h-0 before:border-l-16 before:border-l-transparent before:border-t-12 before:border-t-black/70 before:border-b-12 before:border-b-black/70"
            : "after:content-[''] after:absolute after:-right-4 after:top-4 after:w-0 after:h-0 after:border-r-16 after:border-r-transparent after:border-t-12 after:border-t-black/70 after:border-b-12 after:border-b-black/70"
        }`}
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
