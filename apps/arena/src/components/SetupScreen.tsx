import { motion } from "framer-motion";
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
  const [fighterA, setFighterA] = useState<FighterDef | null>(null);
  const [fighterB, setFighterB] = useState<FighterDef | null>(null);
  const [hoveredA, setHoveredA] = useState<FighterDef | null>(null);
  const [hoveredB, setHoveredB] = useState<FighterDef | null>(null);
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
    topic.length > 5 &&
    fighterA !== null &&
    fighterB !== null &&
    fighterA.id !== fighterB.id;

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

    if (!fighterA || !fighterB) {
      setError("Failed to connect to the Arena Engine.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const matchId = await startMatch({
        topic,
        fighter_a: fighterA.id,
        fighter_b: fighterB.id,
      });
      onMatchStarted(matchId, topic, fighterA, fighterB);
    } catch {
      setError("Failed to connect to the Arena Engine.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen relative z-10 flex flex-col items-center justify-center overflow-hidden"
    >
      <ParallaxBackground />

      {/* GIANT SILHOUETTES (Background Layer) */}
      {/* Player 1 Silhouette (Left) */}
      <div className="absolute left-0 bottom-0 h-[80vh] w-1/3 pointer-events-none z-0 flex items-end justify-start opacity-40">
        <motion.img
          src={(hoveredA || fighterA || roster[0])?.animations.idle}
          animate={{
            filter:
              hoveredA || fighterA
                ? "brightness(1) drop-shadow(0 0 30px rgba(60,130,255,0.5))"
                : "brightness(0)",
            x: hoveredA || fighterA ? 20 : -50,
          }}
          transition={{ type: "spring", stiffness: 100 }}
          className="h-full object-cover pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Player 2 Silhouette (Right) */}
      <div className="absolute right-0 bottom-0 h-[80vh] w-1/3 pointer-events-none z-0 flex items-end justify-end opacity-40">
        <motion.img
          src={(hoveredB || fighterB || roster[1])?.animations.idle}
          animate={{
            filter:
              hoveredB || fighterB
                ? "brightness(1) drop-shadow(0 0 30px rgba(255,60,60,0.5))"
                : "brightness(0)",
            x: hoveredB || fighterB ? -20 : 50,
          }}
          transition={{ type: "spring", stiffness: 100 }}
          className="h-full object-cover pixelated"
          style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
        />
      </div>

      {/* FOREGROUND UI */}
      <div className="z-20 w-full max-w-5xl flex flex-col items-center">
        <h1 className="text-7xl text-arena-text mb-8 tracking-widest uppercase font-black italic drop-shadow-[0_5px_0_rgba(0,0,0,1)]">
          SELECT YOUR DUEL
        </h1>

        {/* Terminal Topic Input */}
        <div className="w-full max-w-3xl mb-12 bg-black/60 p-4 border border-white/10 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-gray-400 font-mono tracking-widest uppercase">
              {">_"} TOPIC OVERRIDE
            </span>
            <button
              type="button"
              onClick={handleRandomTopic}
              className="text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black transition-colors font-mono uppercase"
            >
              RANDOMIZE
            </button>
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={100}
            className="w-full bg-transparent text-2xl font-sans text-white focus:outline-none px-2 placeholder-gray-700"
            placeholder="Is remote work destroying human culture?"
          />
        </div>

        {/* Horizontal Bar Roster Menus */}
        <div className="flex w-full justify-between gap-12 px-8" id="roster">
          {/* Player 1 List */}
          <div className="flex flex-col gap-3 w-full">
            <h2 className="text-2xl text-arena-blue mb-2 tracking-widest font-black uppercase border-b-2 border-arena-blue/30 pb-2 text-right">
              PLAYER 1
            </h2>
            {roster.map((f) => (
              <button
                type="button"
                key={`a-${f.id}`}
                onClick={() => setFighterA(f)}
                onMouseEnter={() => setHoveredA(f)}
                onMouseLeave={() => setHoveredA(null)}
                disabled={fighterB?.id === f.id}
                className={`flex items-center justify-between p-3 border-2 transition-all transform skew-x-[-10deg] ${
                  fighterA?.id === f.id
                    ? "border-arena-blue bg-arena-blue/20 translate-x-4"
                    : "border-gray-800 bg-black/80 hover:border-gray-400 opacity-70 hover:opacity-100 disabled:opacity-20"
                }`}
              >
                <div className="flex items-center gap-4 skew-x-10">
                  <span className="font-bold text-xl uppercase tracking-widest">
                    {f.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="text-6xl text-gray-700 italic font-black flex items-center justify-center">
            VS
          </div>

          {/* Player 2 List */}
          <div className="flex flex-col gap-3 w-full">
            <h2 className="text-2xl text-arena-red mb-2 tracking-widest font-black uppercase border-b-2 border-arena-red/30 pb-2 text-left">
              PLAYER 2
            </h2>
            {roster.map((f) => (
              <button
                type="button"
                key={`b-${f.id}`}
                onClick={() => setFighterB(f)}
                onMouseEnter={() => setHoveredB(f)}
                onMouseLeave={() => setHoveredB(null)}
                disabled={fighterA?.id === f.id}
                className={`flex items-center justify-between p-3 border-2 transition-all transform skew-x-10 ${
                  fighterB?.id === f.id
                    ? "border-arena-red bg-arena-red/20 -translate-x-4"
                    : "border-gray-800 bg-black/80 hover:border-gray-400 opacity-70 hover:opacity-100 disabled:opacity-20"
                }`}
              >
                <div className="flex items-center gap-4 skew-x-[-10deg] w-full justify-end">
                  <span className="font-bold text-xl uppercase tracking-widest">
                    {f.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-arena-red mt-6 font-bold bg-red-900/20 px-6 py-2 border border-arena-red">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || isLoading}
          className="mt-12 text-3xl px-16 py-4 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-gray-300 transition-colors disabled:opacity-20 disabled:hover:bg-white z-20 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          {isLoading ? "LINKING..." : "ENTER ARENA"}
        </button>
      </div>
    </motion.div>
  );
}
