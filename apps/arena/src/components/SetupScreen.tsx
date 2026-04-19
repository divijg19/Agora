import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchRoster, startMatch } from "../lib/api";
import type { FighterDef } from "../types/fighter";
import { ParallaxBackground } from "./ParallaxBackground";

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
  const selectedFighterA =
    roster.find((fighter) => fighter.id === fighterA) ?? null;
  const selectedFighterB =
    roster.find((fighter) => fighter.id === fighterB) ?? null;

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

    if (!selectedFighterA || !selectedFighterB) {
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
      onMatchStarted(matchId, topic, selectedFighterA, selectedFighterB);
    } catch {
      setError("Failed to connect to the Arena Engine.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 1.1 }}
      className="max-w-7xl w-full mx-auto p-8 relative z-10 min-h-[90vh] flex flex-col justify-center"
    >
      <ParallaxBackground />

      <div className="max-w-4xl w-full mx-auto p-4 md:p-5 bg-black/80 backdrop-blur-md border-4 border-arena-border shadow-2xl relative z-10">
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
            <div className="grid grid-cols-2 gap-4">
              {roster.map((f) => (
                <motion.button
                  type="button"
                  key={`a-${f.id}`}
                  onClick={() => setFighterA(f.id)}
                  disabled={fighterB === f.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center justify-center p-4 border-4 transition-all ${
                    fighterA === f.id
                      ? "border-arena-blue bg-arena-blue/20"
                      : "border-arena-border hover:border-gray-500 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  <img
                    src={f.animations.idle}
                    alt={f.name}
                    className="w-20 h-20 object-cover mb-2 pixelated shadow-2xl border-2 border-gray-800"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="text-base font-bold text-center">
                    {f.name}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Fighter Showcase */}
            <div className="mt-8 h-48 flex flex-col items-center justify-end relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedFighterA ? (
                  <motion.div
                    key={selectedFighterA.id}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={selectedFighterA.animations.idle}
                      alt={selectedFighterA.name}
                      className="h-40 object-cover pixelated drop-shadow-[0_0_15px_rgba(60,130,255,0.5)]"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="absolute bottom-2 bg-black/80 px-4 py-1 border-t-2 border-arena-blue text-arena-blue font-mono tracking-widest text-sm">
                      "{selectedFighterA.tagline}"
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-600 font-mono tracking-widest uppercase text-xl animate-pulse pb-10"
                  >
                    AWAITING SELECTION...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Fighter B Selection */}
          <div>
            <h2 className="text-2xl text-arena-red mb-2 text-center">
              FIGHTER B
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {roster.map((f) => (
                <motion.button
                  type="button"
                  key={`b-${f.id}`}
                  onClick={() => setFighterB(f.id)}
                  disabled={fighterA === f.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center justify-center p-4 border-4 transition-all ${
                    fighterB === f.id
                      ? "border-arena-red bg-arena-red/20"
                      : "border-arena-border hover:border-gray-500 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  <img
                    src={f.animations.idle}
                    alt={f.name}
                    className="w-20 h-20 object-cover mb-2 pixelated shadow-2xl border-2 border-gray-800"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="text-base font-bold text-center">
                    {f.name}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Fighter Showcase */}
            <div className="mt-8 h-48 flex flex-col items-center justify-end relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedFighterB ? (
                  <motion.div
                    key={selectedFighterB.id}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={selectedFighterB.animations.idle}
                      alt={selectedFighterB.name}
                      className="h-40 object-cover pixelated drop-shadow-[0_0_15px_rgba(255,60,60,0.5)]"
                      style={{
                        imageRendering: "pixelated",
                        transform: "scaleX(-1)",
                      }}
                    />
                    <div className="absolute bottom-2 bg-black/80 px-4 py-1 border-t-2 border-arena-red text-arena-red font-mono tracking-widest text-sm">
                      "{selectedFighterB.tagline}"
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-b"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-600 font-mono tracking-widest uppercase text-xl animate-pulse pb-10"
                  >
                    AWAITING SELECTION...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-arena-red text-center mb-2">{error}</div>
        )}

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
      </div>
    </motion.div>
  );
}
