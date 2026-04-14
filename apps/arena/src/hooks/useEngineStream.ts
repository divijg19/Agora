import { useEffect, useRef, useState } from "react";

export type ArenaStatus = "idle" | "debating" | "judging" | "completed";

export interface MatchVerdict {
  winner_id: string;
  fighter_a_critique: string;
  fighter_b_critique: string;
  punchline_reasoning: string;
}

export function useEngineStream(matchId: string | null) {
  const [status, setStatus] = useState<ArenaStatus>("idle");
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [verdict, setVerdict] = useState<MatchVerdict | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!matchId) return;

    setStatus("debating");
    setRawText("");

    const sse = new EventSource(`http://localhost:8000/api/stream/${matchId}`);
    eventSourceRef.current = sse;

    sse.addEventListener("turn_start", (e) => {
      const data = JSON.parse(e.data);
      setCurrentSpeaker(data.speaker_id);
      setRawText(""); // Clear dialogue box for new turn
    });

    sse.addEventListener("chunk", (e) => {
      const data = JSON.parse(e.data);
      setRawText((prev) => prev + data.text);
    });

    sse.addEventListener("judge_evaluating", () => {
      setStatus("judging");
      setCurrentSpeaker("judge");
      setRawText("THE JUDGE IS EVALUATING THE DUEL...");
    });

    sse.addEventListener("match_result", (e) => {
      const data: MatchVerdict = JSON.parse(e.data);
      setVerdict(data);
      setStatus("completed");
      sse.close();
    });

    sse.onerror = () => {
      console.error("SSE Connection Error");
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [matchId]);

  return { status, currentSpeaker, rawText, verdict };
}
