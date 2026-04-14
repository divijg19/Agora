import { useState } from "react";
import { SetupScreen } from "./components/SetupScreen";

function App() {
  const [matchId, setMatchId] = useState<string | null>(null);

  return (
    <>
      <div className="crt-overlay" />
      <div className="vignette" />

      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        {!matchId ? (
          <SetupScreen onMatchStarted={setMatchId} />
        ) : (
          <div className="text-center text-arena-blue text-4xl animate-pulse">
            MATCH {matchId} INITIALIZED.
            <br />
            (Arena Combat Screen Coming in v0.2.3)
          </div>
        )}
      </main>
    </>
  );
}

export default App;
