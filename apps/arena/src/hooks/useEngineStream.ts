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

export interface NetworkTurn {
  id: string;
  speaker_id: string;
  text: string;
  intent: string;
}

export function useEngineStream(matchId: string | null) {
  const [status, setStatus] = useState<ArenaStatus>("idle");
  const [networkTurns, setNetworkTurns] = useState<NetworkTurn[]>([]);
  const [visualTurnIndex, setVisualTurnIndex] = useState(0);
  const [verdict, setVerdict] = useState<MatchVerdict | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const hasCompletedRef = useRef(false);
  const pendingTurnRef = useRef<{
    speaker_id: string;
    intent: string;
  } | null>(null);
  const turnIdRef = useRef(0);

  useEffect(() => {
    if (!matchId) return;

    setStatus("debating");
    setNetworkTurns([]);
    setVisualTurnIndex(0);
    setVerdict(null);
    setTurnCount(0);
    setErrorMessage(null);
    hasCompletedRef.current = false;
    pendingTurnRef.current = null;
    turnIdRef.current = 0;

    const sse = new EventSource(`http://localhost:8000/api/stream/${matchId}`);
    eventSourceRef.current = sse;

    sse.addEventListener("turn_start", (e) => {
      const data: { speaker_id: string; intent?: string } = JSON.parse(e.data);
      pendingTurnRef.current = {
        speaker_id: data.speaker_id,
        intent: data.intent || "opening",
      };
      setTurnCount((prev) => prev + 1);
    });

    sse.addEventListener("chunk", () => {
      // Chunks are intentionally ignored for visual rendering.
      // We only stage complete turns from `turn_end` events.
    });

    sse.addEventListener("turn_end", (e) => {
      const data: { text: string } = JSON.parse(e.data);
      const pending = pendingTurnRef.current;
      if (!pending) return;

      setNetworkTurns((prev) => [
        ...prev,
        {
          id: `turn-${turnIdRef.current++}`,
          speaker_id: pending.speaker_id,
          intent: pending.intent,
          text: data.text,
        },
      ]);
      pendingTurnRef.current = null;
    });

    sse.addEventListener("judge_evaluating", () => {
      setStatus("judging");
    });

    sse.addEventListener("match_result", (e) => {
      const data: MatchVerdict = JSON.parse(e.data);
      setVerdict(data);
      setStatus("completed");
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

  const activeTurn = networkTurns[visualTurnIndex];
  const currentSpeaker = activeTurn?.speaker_id || null;
  const currentIntent = activeTurn?.intent || null;
  const rawText = activeTurn?.text || "";

  const advanceVisualTurn = () => setVisualTurnIndex((prev) => prev + 1);

  return {
    status,
    currentSpeaker,
    currentIntent,
    rawText,
    networkTurns,
    visualTurnIndex,
    advanceVisualTurn,
    verdict,
    turnCount,
    errorMessage,
  };
}
