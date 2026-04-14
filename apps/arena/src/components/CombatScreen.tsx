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
  const { status, currentSpeaker, rawText, verdict } = useEngineStream(matchId);

  const fighterA = ROSTER.find((f) => f.id === fighterAId);
  const fighterB = ROSTER.find((f) => f.id === fighterBId);

  if (!fighterA || !fighterB) {
    return null;
  }

  // Determine who is currently speaking for the UI
  const isASpeaking = currentSpeaker === fighterAId;
  const isBSpeaking = currentSpeaker === fighterBId;
  const isJudge = status === "judging" || currentSpeaker === "judge";

  // Determine the display name for the dialogue box
  let speakerName = null;
  if (isASpeaking) speakerName = fighterA.name;
  if (isBSpeaking) speakerName = fighterB.name;
  if (isJudge) speakerName = "THE JUDGE";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl w-full mx-auto p-4 flex flex-col justify-between h-[80vh]"
    >
      {/* Header Topic */}
      <div className="text-center mb-8 border-b-2 border-arena-border pb-4">
        <h2 className="text-xl text-gray-400">CURRENT DEBATE:</h2>
        <h1 className="text-3xl text-arena-text font-bold uppercase">
          {topic}
        </h1>
      </div>

      {/* The Stage */}
      <div className="flex justify-between items-end px-10 grow mb-10 relative">
        <FighterSprite
          fighter={fighterA}
          isActive={isASpeaking}
          facing="right"
        />

        {/* VS or Judge Graphic */}
        <div className="absolute left-1/2 bottom-20 -translate-x-1/2 flex flex-col items-center">
          {status === "judging" && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity }}
              className="text-4xl text-yellow-500 font-bold mb-4"
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
        />
      </div>

      {/* The Dialogue & Verdict Area */}
      {status === "completed" && verdict ? (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-4 border-yellow-500 bg-black p-8 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
        >
          <h2 className="text-4xl text-yellow-500 mb-6 text-center">
            🏆 VERDICT RENDERED
          </h2>
          <p className="text-2xl mb-4 leading-relaxed">
            {verdict.punchline_reasoning}
          </p>
          <div className="text-center mt-6">
            <span className="text-xl text-gray-400">WINNER: </span>
            <span className="text-3xl font-bold uppercase text-arena-green">
              {ROSTER.find((f) => f.id === verdict.winner_id)?.name}
            </span>
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
