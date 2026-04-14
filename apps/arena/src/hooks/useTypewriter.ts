import { useEffect, useRef, useState } from "react";

export function useTypewriter(rawText: string, speedMs: number = 30) {
  const [displayedText, setDisplayedText] = useState("");
  const displayedRef = useRef("");
  const bufferedTextRef = useRef("");
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    displayedRef.current = displayedText;
  }, [displayedText]);

  useEffect(() => {
    if (speedMs <= 0) {
      queueRef.current = [];
      bufferedTextRef.current = rawText;
      setDisplayedText(rawText);
      return;
    }

    const isReset =
      rawText === "" ||
      rawText.length < bufferedTextRef.current.length ||
      !rawText.startsWith(bufferedTextRef.current);

    if (isReset) {
      queueRef.current = [];
      bufferedTextRef.current = "";

      if (displayedRef.current !== "") {
        displayedRef.current = "";
        setDisplayedText("");
      }
    }

    const delta = rawText.slice(bufferedTextRef.current.length);

    if (delta.length > 0) {
      queueRef.current.push(...delta.split(""));
      bufferedTextRef.current = rawText;
    }

    if (rawText === "" && displayedRef.current === "") {
      bufferedTextRef.current = "";
    }
  }, [rawText, speedMs]);

  useEffect(() => {
    if (speedMs <= 0) {
      return;
    }

    const intervalId = setInterval(
      () => {
        const nextChar = queueRef.current.shift();

        if (!nextChar) {
          return;
        }

        setDisplayedText((prev) => prev + nextChar);
      },
      Math.max(speedMs, 1),
    );

    return () => clearInterval(intervalId);
  }, [speedMs]);

  return displayedText;
}
