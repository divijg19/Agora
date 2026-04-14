import { useEffect, useRef, useState } from "react";

export function useTypewriter(rawText: string, speedMs: number = 30) {
  const [displayedText, setDisplayedText] = useState("");
  const currentIndex = useRef(0);

  // Reset if rawText is completely cleared (new turn)
  useEffect(() => {
    if (rawText === "") {
      setDisplayedText("");
      currentIndex.current = 0;
    }
  }, [rawText]);

  useEffect(() => {
    if (currentIndex.current < rawText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + rawText[currentIndex.current]);
        currentIndex.current += 1;
      }, speedMs);

      return () => clearTimeout(timeout);
    }
  }, [rawText, displayedText, speedMs]);

  return displayedText;
}
