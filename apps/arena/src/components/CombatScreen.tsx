import { motion } from "framer-motion";
import { useEngineStream } from "../hooks/useEngineStream";
import { ROSTER } from "../lib/roster";
import { DialogueBox } from "./DialogueBox";
import { FighterSprite } from "./FighterSprite";

interface CombatScreenProps {
  matchId: string;
  topic: string;
  fighterAId: string;
  fighterBId: string;
}

export function CombatScreen({
  matchId,
  topic,
  fighterAId,
  fighterBId,
}: CombatScreenProps) {
  const { status, currentSpeaker, rawText, verdict, turnCount } =
    useEngineStream(matchId);

  const fighterA = ROSTER.find((f) => f.id === fighterAId);
  const fighterB = ROSTER.find((f) => f.id === fighterBId);

  if (!fighterA || !fighterB)
    return <div className="text-white">Fighter not found.</div>;

  const isASpeaking = currentSpeaker === fighterAId;
  const isBSpeaking = currentSpeaker === fighterBId;
  const isJudge = status === "judging" || currentSpeaker === "judge";

  let speakerName = null;
  if (isASpeaking) speakerName = fighterA.name;
  if (isBSpeaking) speakerName = fighterB.name;
  if (isJudge) speakerName = "THE JUDGE";

  // Calculate HP for game feel (Loser drops to 0 at the end)
  const isComplete = status === "completed" && verdict;
  const hpA = isComplete ? (verdict.winner_id === fighterAId ? 100 : 0) : 100;
  const hpB = isComplete ? (verdict.winner_id === fighterBId ? 100 : 0) : 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl w-full mx-auto p-4 flex flex-col justify-between h-[85vh] relative z-10"
    >
      {/* Header Topic & Turn Indicator */}
      <div className="text-center mb-8 border-b-2 border-arena-border pb-4 relative">
        <h2 className="text-xl text-gray-400">CURRENT DEBATE:</h2>
        <h1 className="text-3xl text-arena-text font-bold uppercase">
          {topic}
        </h1>
        {status === "debating" && turnCount > 0 && (
          <div className="absolute right-0 top-0 text-arena-blue font-bold text-2xl border-2 border-arena-blue px-3 py-1">
            TURN {turnCount}
          </div>
        )}
      </div>

      {/* The Stage */}
      <div className="flex justify-between items-end px-10 grow mb-10 relative">
        <FighterSprite
          fighter={fighterA}
          isActive={isASpeaking}
          facing="right"
          hp={hpA}
        />

        {/* VS or Judge Graphic */}
        <div className="absolute left-1/2 bottom-20 -translate-x-1/2 flex flex-col items-center">
          {status === "judging" && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity }}
              className="text-4xl text-yellow-500 font-bold mb-4 drop-shadow-[0_0_10px_#eab308]"
            >
              EVALUATING...
            </motion.div>
          )}
          {status === "debating" && (
            <h1 className="text-6xl text-arena-red italic font-bold opacity-30">
              VS
            </h1>
          )}
        </div>

        <FighterSprite
          fighter={fighterB}
          isActive={isBSpeaking}
          facing="left"
          hp={hpB}
        />
      </div>

      {/* The Dialogue & Verdict Area */}
      {isComplete ? (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-4 border-yellow-500 bg-black p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] max-h-[40vh] overflow-y-auto"
        >
          <h2 className="text-4xl text-yellow-500 mb-6 text-center border-b-2 border-yellow-500/30 pb-4">
            🏆 WINNER: {ROSTER.find((f) => f.id === verdict.winner_id)?.name} 🏆
          </h2>

          <p className="text-2xl mb-8 leading-relaxed text-center font-bold">
            "{verdict.punchline_reasoning}"
          </p>

          {/* Critique Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`p-4 border-2 ${verdict.winner_id === fighterAId ? "border-arena-green" : "border-arena-red"}`}
            >
              <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                {fighterA.name} Critique:
              </h3>
              <p className="text-lg text-gray-300">
                {verdict.fighter_a_critique}
              </p>
            </div>
            <div
              className={`p-4 border-2 ${verdict.winner_id === fighterBId ? "border-arena-green" : "border-arena-red"}`}
            >
              <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                {fighterB.name} Critique:
              </h3>
              <p className="text-lg text-gray-300">
                {verdict.fighter_b_critique}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <DialogueBox
          speakerName={speakerName}
          rawText={rawText}
          isJudge={isJudge}
        />
      )}
    </motion.div>
  );
}
