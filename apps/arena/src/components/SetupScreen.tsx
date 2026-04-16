import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchRoster, startMatch } from "../lib/api";
import type { FighterDef } from "../types/fighter";

interface SetupScreenProps {
  onMatchStarted: (
    matchId: string,
    topic: string,
    fighterA: FighterDef,
    fighterB: FighterDef,
  ) => void;
}

export function SetupScreen({ onMatchStarted }: SetupScreenProps) {
  const [roster, setRoster] = useState<FighterDef[]>([]);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [fighterA, setFighterA] = useState<string | null>(null);
  const [fighterB, setFighterB] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const randomTopics = [
    "Is AI dangerous?",
    "Remote work vs Office",
    "UBI vs Capitalism",
    "Simulation Theory",
  ];

  useEffect(() => {
    fetchRoster()
      .then(setRoster)
      .catch(() =>
        setRosterError("ARENA ENGINE OFFLINE. PLEASE TRY AGAIN LATER."),
      );
  }, []);

  const canStart =
    topic.length > 5 && fighterA && fighterB && fighterA !== fighterB;

  const handleRandomTopic = () => {
    const choice =
      randomTopics[Math.floor(Math.random() * randomTopics.length)];
    setTopic(choice);
  };

  if (rosterError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center z-10 relative">
        <h1 className="text-4xl text-arena-red mb-4">CRITICAL ERROR</h1>
        <p className="text-xl text-gray-400">{rosterError}</p>
      </div>
    );
  }

  if (roster.length === 0) {
    return (
      <div className="text-white text-center p-10 z-10 relative text-2xl animate-pulse">
        CONNECTING TO ARENA...
      </div>
    );
  }

  const handleStart = async () => {
    if (!canStart) return;

    const selectedA = roster.find((fighter) => fighter.id === fighterA);
    const selectedB = roster.find((fighter) => fighter.id === fighterB);
    if (!selectedA || !selectedB) {
      setError("Failed to connect to the Arena Engine.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const matchId = await startMatch({
        topic,
        fighter_a: fighterA,
        fighter_b: fighterB,
      });
      onMatchStarted(matchId, topic, selectedA, selectedB);
    } catch {
      setError("Failed to connect to the Arena Engine.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      className="max-w-4xl w-full mx-auto p-4 md:p-5 bg-arena-panel border-4 border-arena-border shadow-2xl relative z-10 h-[92vh]"
    >
      <h1 className="text-4xl md:text-5xl text-center text-arena-red mb-4 tracking-widest drop-shadow-[0_0_8px_#ff3c3c]">
        SELECT YOUR DUEL
      </h1>

      <div className="mb-4">
        <label
          htmlFor="debate-topic"
          className="block text-arena-text text-xl mb-2"
        >
          ENTER THE TOPIC:
        </label>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            id="debate-topic"
            type="text"
            value={topic}
            maxLength={100}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Is artificial intelligence a threat to humanity?"
            className="w-full bg-black border-2 border-arena-border p-3 text-lg text-arena-text focus:outline-none focus:border-arena-blue transition-colors"
          />
          <button
            type="button"
            onClick={handleRandomTopic}
            className="px-4 py-3 border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors whitespace-nowrap"
          >
            🎲 RANDOM TOPIC
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Fighter A Selection */}
        <div>
          <h2 className="text-2xl text-arena-blue mb-2 text-center">
            FIGHTER A
          </h2>
          <div className="flex flex-col gap-3">
            {roster.map((f) => (
              <button
                type="button"
                key={`a-${f.id}`}
                onClick={() => setFighterA(f.id)}
                disabled={fighterB === f.id}
                className={`p-2.5 border-2 text-left transition-all ${
                  fighterA === f.id
                    ? "border-arena-blue bg-arena-blue/20 translate-x-2"
                    : "border-arena-border hover:border-gray-500 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                }`}
              >
                <div className="text-xl font-bold">{f.name}</div>
                <div className="text-sm text-gray-400">{f.tagline}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Fighter B Selection */}
        <div>
          <h2 className="text-2xl text-arena-red mb-2 text-center">
            FIGHTER B
          </h2>
          <div className="flex flex-col gap-3">
            {roster.map((f) => (
              <button
                type="button"
                key={`b-${f.id}`}
                onClick={() => setFighterB(f.id)}
                disabled={fighterA === f.id}
                className={`p-2.5 border-2 text-left transition-all ${
                  fighterB === f.id
                    ? "border-arena-red bg-arena-red/20 -translate-x-2"
                    : "border-arena-border hover:border-gray-500 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                }`}
              >
                <div className="text-xl font-bold">{f.name}</div>
                <div className="text-sm text-gray-400">{f.tagline}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="text-arena-red text-center mb-2">{error}</div>}

      <div className="text-center">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || isLoading}
          className="text-2xl md:text-3xl px-10 py-3 border-4 border-arena-text hover:bg-arena-text hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-arena-text"
        >
          {isLoading ? "INITIALIZING..." : "ENTER ARENA"}
        </button>
      </div>
    </motion.div>
  );
}
