import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { CombatScreen } from "./components/CombatScreen";
import { SetupScreen } from "./components/SetupScreen";
import { SpriteTransitionBridge } from "./components/SpriteTransitionBridge";
import { TRANSITION_DURATION_MS } from "./lib/spritePositioning";
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

  // When match starts, mount CombatScreen immediately (so engine auto-starts),
  // then show the transition bridge on top as the cinematic intro.
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
    setMatchConfig(matchData);
    setTransitioningMatch(matchData);
  };

  // Safety timeout in case onAnimationComplete doesn't fire; always clear
  // the bridge after a short delay so the combat reveal proceeds.
  useEffect(() => {
    if (transitioningMatch) {
      const timer = setTimeout(() => {
        setTransitioningMatch(null);
      }, TRANSITION_DURATION_MS + 200);
      return () => clearTimeout(timer);
    }
    return;
  }, [transitioningMatch]);

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

      <main className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          {matchConfig && (
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
        </div>

        {(!matchConfig || transitioningMatch) && (
          <div className="absolute inset-0 z-10">
            <SetupScreen
              key="setup"
              onMatchStarted={handleMatchStarted}
              isTransitioning={Boolean(transitioningMatch)}
            />
          </div>
        )}

        <AnimatePresence>
          {transitioningMatch && (
            <SpriteTransitionBridge
              fighterA={transitioningMatch.fighterA}
              fighterB={transitioningMatch.fighterB}
              onTransitionComplete={() => setTransitioningMatch(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

export default App;
