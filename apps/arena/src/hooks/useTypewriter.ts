import { useEffect, useRef, useState } from "react";

export function useTypewriter(rawText: string, speedMs: number = 25) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const currentIndex = useRef(0);

  useEffect(() => {
    if (rawText === "") {
      setDisplayedText(rawText);
      currentIndex.current = 0;
      setIsTyping(false);
    } else {
      setIsTyping(currentIndex.current < rawText.length);
    }
  }, [rawText]);

  useEffect(() => {
    if (speedMs <= 0) {
      setDisplayedText(rawText);
      currentIndex.current = rawText.length;
      setIsTyping(false);
      return;
    }

    if (currentIndex.current >= rawText.length) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (currentIndex.current >= rawText.length) {
          setIsTyping(false);
          clearInterval(interval);
          return prev;
        }

        const next = prev + rawText[currentIndex.current];
        currentIndex.current += 1;

        if (currentIndex.current >= rawText.length) {
          setIsTyping(false);
          clearInterval(interval);
        }

        return next;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [rawText, speedMs]);

  return { displayedText, isTyping };
}
