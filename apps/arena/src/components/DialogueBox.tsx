import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useTypewriter } from "../hooks/useTypewriter";

interface DialogueBoxProps {
  speakerName: string | null;
  rawText: string;
  isJudge?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
}

export function DialogueBox({
  speakerName,
  rawText,
  isJudge = false,
  onTypingChange,
}: DialogueBoxProps) {
  // The typewriter hook drips the text out at retro speed
  const { displayedText, isTyping } = useTypewriter(rawText, 20);

  useEffect(() => {
    onTypingChange?.(isTyping);
  }, [isTyping, onTypingChange]);

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
      <div className="text-2xl leading-relaxed tracking-wide">
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
