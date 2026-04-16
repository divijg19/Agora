import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTypewriter } from "../hooks/useTypewriter";

interface DialogueBoxProps {
  speakerName: string | null;
  rawText: string;
  isJudge?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
  onTypingComplete?: () => void;
}

export function DialogueBox({
  speakerName,
  rawText,
  isJudge = false,
  onTypingChange,
  onTypingComplete,
}: DialogueBoxProps) {
  // The typewriter hook drips the text out at retro speed
  const { displayedText, isTyping } = useTypewriter(rawText, 20);
  const completedTextRef = useRef<string | null>(null);

  useEffect(() => {
    onTypingChange?.(isTyping);
  }, [isTyping, onTypingChange]);

  useEffect(() => {
    if (rawText === "") {
      completedTextRef.current = null;
      return;
    }

    const hasCompleted = !isTyping && displayedText === rawText;
    if (!hasCompleted) return;

    if (completedTextRef.current === rawText) return;
    completedTextRef.current = rawText;
    onTypingComplete?.();
  }, [displayedText, isTyping, rawText, onTypingComplete]);

  return (
    <div
      className={`relative w-full border-4 p-6 bg-black min-h-50 shadow-2xl ${
        isJudge ? "border-yellow-500" : "border-arena-border"
      }`}
    >
      {/* Speaker Name Badge */}
      <AnimatePresence>
        {speakerName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute -top-6 left-4 px-4 py-1 text-xl font-bold uppercase border-4 bg-black ${
              isJudge
                ? "border-yellow-500 text-yellow-500"
                : "border-arena-border text-arena-text"
            }`}
          >
            {speakerName}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Text */}
      <div className="text-2xl leading-relaxed tracking-wide max-h-[30vh] overflow-y-auto pr-2">
        {displayedText}
        {/* Blinking Cursor */}
        <motion.span
          animate={{ opacity: isTyping ? [1, 0] : 1 }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-3 h-6 bg-arena-text ml-1 align-middle"
        />
      </div>
    </div>
  );
}
