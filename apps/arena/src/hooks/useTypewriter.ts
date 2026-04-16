import { useEffect, useRef, useState } from "react";

export function useTypewriter(rawText: string, speedMs: number = 20) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const queueRef = useRef<string[]>([]);
  const processedLengthRef = useRef(0);
  const processedTextRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (speedMs <= 0) {
      queueRef.current = [];
      processedLengthRef.current = rawText.length;
      processedTextRef.current = rawText;
      setDisplayedText(rawText);
      setIsTyping(false);
      return;
    }

    if (rawText === "") {
      queueRef.current = [];
      processedLengthRef.current = 0;
      processedTextRef.current = "";
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    if (!rawText.startsWith(processedTextRef.current)) {
      queueRef.current = [];
      processedLengthRef.current = 0;
      processedTextRef.current = "";
      setDisplayedText("");
    }

    const nextChunk = rawText.slice(processedLengthRef.current);
    if (nextChunk.length > 0) {
      queueRef.current.push(...nextChunk.split(""));
      processedLengthRef.current = rawText.length;
      processedTextRef.current = rawText;
      setIsTyping(true);
      return;
    }

    if (queueRef.current.length === 0) {
      setIsTyping(false);
    }
  }, [rawText, speedMs]);

  useEffect(() => {
    if (speedMs <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const nextChar = queueRef.current.shift();
      if (!nextChar) {
        setIsTyping(false);
        return;
      }

      setDisplayedText((prev) => prev + nextChar);
      setIsTyping(queueRef.current.length > 0);
    }, speedMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [speedMs]);

  return { displayedText, isTyping };
}
