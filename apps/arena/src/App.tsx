import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CombatScreen } from "./components/CombatScreen";
import { SetupScreen } from "./components/SetupScreen";
import type { FighterDef } from "./types/fighter";

// To store the setup data for the Combat screen
interface MatchConfig {
  id: string;
  topic: string;
  fighterA: FighterDef;
  fighterB: FighterDef;
}

function App() {
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);

  // We change the onMatchStarted callback to capture the full config
  const handleMatchStarted = (
    id: string,
    topic: string,
    fighterA: FighterDef,
    fighterB: FighterDef,
  ) => {
    setMatchConfig({ id, topic, fighterA, fighterB });
  };

  const handleReset = () => {
    setMatchConfig(null);
  };

  return (
    <>
      <div className="crt-overlay" />
      <div className="vignette" />

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
              onRestart={handleReset}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

export default App;
