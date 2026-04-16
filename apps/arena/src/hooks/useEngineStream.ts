import { useEffect, useRef, useState } from "react";

export type ArenaStatus =
  | "idle"
  | "debating"
  | "judging"
  | "completed"
  | "error";

export interface MatchVerdict {
  winner_id: string;
  fighter_a_critique: string;
  fighter_b_critique: string;
  punchline_reasoning: string;
}

export interface TranscriptTurn {
  id: string;
  speaker: string;
  text: string;
}

export function useEngineStream(matchId: string | null) {
  const [status, setStatus] = useState<ArenaStatus>("idle");
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [currentIntent, setCurrentIntent] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [verdict, setVerdict] = useState<MatchVerdict | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const hasCompletedRef = useRef(false);
  const currentSpeakerRef = useRef<string | null>(null);
  const transcriptIdRef = useRef(0);

  useEffect(() => {
    if (!matchId) return;

    setStatus("debating");
    setCurrentSpeaker(null);
    setCurrentIntent(null);
    setRawText("");
    setTranscript([]);
    setVerdict(null);
    setTurnCount(0);
    setErrorMessage(null);
    hasCompletedRef.current = false;
    currentSpeakerRef.current = null;
    transcriptIdRef.current = 0;

    const sse = new EventSource(`http://localhost:8000/api/stream/${matchId}`);
    eventSourceRef.current = sse;

    sse.addEventListener("turn_start", (e) => {
      const data: { speaker_id: string; intent?: string } = JSON.parse(e.data);
      setCurrentSpeaker(data.speaker_id);
      currentSpeakerRef.current = data.speaker_id;
      setCurrentIntent(data.intent || "opening");
      setRawText(""); // Clear dialogue box for new turn
      setTurnCount((prev) => prev + 1);
    });

    sse.addEventListener("chunk", (e) => {
      const data = JSON.parse(e.data);
      setRawText((prev) => prev + data.text);
    });

    sse.addEventListener("turn_end", (e) => {
      const data: { text: string } = JSON.parse(e.data);
      const speaker = currentSpeakerRef.current;
      if (!speaker) return;

      setTranscript((prev) => [
        ...prev,
        {
          id: `${speaker}-${transcriptIdRef.current++}`,
          speaker,
          text: data.text,
        },
      ]);
    });

    sse.addEventListener("judge_evaluating", () => {
      setStatus("judging");
      setCurrentSpeaker("judge");
      setCurrentIntent(null);
      setRawText("THE JUDGE IS EVALUATING THE DUEL...");
    });

    sse.addEventListener("match_result", (e) => {
      const data: MatchVerdict = JSON.parse(e.data);
      setVerdict(data);
      setStatus("completed");
      setCurrentIntent(null);
      hasCompletedRef.current = true;
      sse.close();
    });

    sse.onerror = (err) => {
      console.error("SSE Connection Error:", err);
      if (!hasCompletedRef.current) {
        setStatus("error");
        setErrorMessage("THE CONNECTION TO THE ARENA ENGINE WAS LOST.");
      }
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [matchId]);

  return {
    status,
    currentSpeaker,
    currentIntent,
    rawText,
    transcript,
    verdict,
    turnCount,
    errorMessage,
  };
}
