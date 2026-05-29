import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { CombatScreen } from "./components/CombatScreen";
import { SetupScreen } from "./components/SetupScreen";
import { SpriteTransitionBridge } from "./components/SpriteTransitionBridge";
import type { FighterDef } from "./types/fighter";

// To store the setup data for the Combat screen
interface MatchConfig {
  id: string;
  topic: string;
  fighterA: FighterDef;
  fighterB: FighterDef;
  debateMode: "manual" | "auto";
}

function App() {
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [transitioningMatch, setTransitioningMatch] =
    useState<MatchConfig | null>(null);

  const finalizeTransition = useCallback((nextMatch: MatchConfig | null) => {
    if (!nextMatch) return;
    setMatchConfig(nextMatch);
    setTransitioningMatch(null);
  }, []);

  // When match starts, show the transition bridge first
  const handleMatchStarted = (
    id: string,
    topic: string,
    fighterA: FighterDef,
    fighterB: FighterDef,
    debateMode: "manual" | "auto",
  ) => {
    const matchData: MatchConfig = {
      id,
      topic,
      fighterA,
      fighterB,
      debateMode,
    };
    setTransitioningMatch(matchData);
  };

  // Called when the sprite transition bridge animation completes
  const handleTransitionComplete = () => {
    finalizeTransition(transitioningMatch);
  };

  // Safety timeout in case onAnimationComplete doesn't fire
  useEffect(() => {
    if (transitioningMatch && !matchConfig) {
      const timer = setTimeout(() => {
        finalizeTransition(transitioningMatch);
      }, 700); // Slightly longer than bridge animation (600ms)
      return () => clearTimeout(timer);
    }
  }, [transitioningMatch, matchConfig, finalizeTransition]);

  const handleUpdateDebateMode = (mode: "manual" | "auto") => {
    setMatchConfig((prev) => (prev ? { ...prev, debateMode: mode } : prev));
  };

  const handleReset = () => {
    setMatchConfig(null);
    setTransitioningMatch(null);
  };

  return (
    <>
      <div className="crt-overlay" />
      <div className="vignette" />

      {/* Sprite transition bridge shows during the match start animation */}
      <AnimatePresence>
        {transitioningMatch && (
          <SpriteTransitionBridge
            fighterA={transitioningMatch.fighterA}
            fighterB={transitioningMatch.fighterB}
            onTransitionComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>

      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {!matchConfig ? (
            <SetupScreen key="setup" onMatchStarted={handleMatchStarted} />
          ) : (
            <CombatScreen
              key="combat"
              matchId={matchConfig.id}
              topic={matchConfig.topic}
              fighterA={matchConfig.fighterA}
              fighterB={matchConfig.fighterB}
              debateMode={matchConfig.debateMode}
              onUpdateDebateMode={handleUpdateDebateMode}
              onRestart={handleReset}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

export default App;
