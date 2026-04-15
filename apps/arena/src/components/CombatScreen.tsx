import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useEngineStream } from "../hooks/useEngineStream";
import { ROSTER } from "../lib/roster";
import { DialogueBox } from "./DialogueBox";
import { FighterSprite } from "./FighterSprite";

interface CombatScreenProps {
  matchId: string;
  topic: string;
  fighterAId: string;
  fighterBId: string;
  onRestart: () => void;
}

export function CombatScreen({
  matchId,
  topic,
  fighterAId,
  fighterBId,
  onRestart,
}: CombatScreenProps) {
  const { status, currentSpeaker, rawText, verdict, turnCount } =
    useEngineStream(matchId);
  const [showVerdictModal, setShowVerdictModal] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeakerVisual, setActiveSpeakerVisual] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isTyping) {
      setActiveSpeakerVisual(currentSpeaker);
    }
  }, [currentSpeaker, isTyping]);

  useEffect(() => {
    if (status === "completed") {
      setShowVerdictModal(true);
    }
  }, [status]);

  const fighterA = ROSTER.find((f) => f.id === fighterAId);
  const fighterB = ROSTER.find((f) => f.id === fighterBId);

  if (!fighterA || !fighterB)
    return <div className="text-white">Fighter not found.</div>;

  const isASpeaking = activeSpeakerVisual === fighterAId;
  const isBSpeaking = activeSpeakerVisual === fighterBId;
  const isJudge = activeSpeakerVisual === "judge";

  let speakerName = null;
  if (isASpeaking) speakerName = fighterA.name;
  if (isBSpeaking) speakerName = fighterB.name;
  if (isJudge) speakerName = "THE JUDGE";

  // Calculate HP for game feel (Loser drops to 0 at the end)
  const isComplete = status === "completed" && verdict !== null;
  const modalOpen = isComplete && showVerdictModal;
  const hpA = isComplete ? (verdict.winner_id === fighterAId ? 100 : 0) : 100;
  const hpB = isComplete ? (verdict.winner_id === fighterBId ? 100 : 0) : 100;
  const winnerName = isComplete
    ? ROSTER.find((f) => f.id === verdict.winner_id)?.name
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl w-full mx-auto p-4 flex flex-col justify-between h-[85vh] relative z-10"
    >
      {/* Header Topic & Turn Indicator */}
      <div
        className={`text-center mb-8 border-b-2 border-arena-border pb-4 relative transition-all duration-300 ${
          modalOpen ? "opacity-60 blur-[1px]" : "opacity-100"
        }`}
      >
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
      <div
        className={`flex justify-between items-end px-10 grow mb-10 relative transition-all duration-300 ${
          modalOpen ? "opacity-60 blur-[1px]" : "opacity-100"
        }`}
      >
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

      {/* The Dialogue Area */}
      <div
        className={`transition-all duration-300 ${
          modalOpen ? "opacity-60 blur-[1px]" : "opacity-100"
        }`}
      >
        {isComplete && !showVerdictModal ? (
          <div className="w-full border-4 border-arena-border p-6 bg-black min-h-50 shadow-2xl max-h-[36vh] overflow-y-auto">
            <h3 className="text-3xl font-bold uppercase text-arena-text mb-3">
              Debate Concluded
            </h3>
            <p className="text-xl text-gray-300 mb-2">Winner: {winnerName}</p>
            <p className="text-lg text-gray-400 mb-6 leading-relaxed">
              Review mode is active. Full transcript playback can be added next,
              while this panel keeps the duel state visible and lets you start a
              new match.
            </p>
            <button
              type="button"
              onClick={onRestart}
              className="px-6 py-3 text-2xl border-4 border-arena-green text-arena-green hover:bg-arena-green hover:text-black transition-colors"
            >
              NEW DUEL
            </button>
          </div>
        ) : (
          <DialogueBox
            speakerName={speakerName}
            rawText={rawText}
            isJudge={isJudge}
            onTypingChange={setIsTyping}
          />
        )}
      </div>

      {/* Full-Screen Verdict Modal */}
      {isComplete && verdict && showVerdictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/75"
          />

          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-5xl max-h-[85vh] overflow-y-auto border-4 border-yellow-500 bg-black p-10 shadow-[0_0_40px_rgba(234,179,8,0.3)]"
          >
            <h2 className="text-5xl text-yellow-500 text-center font-bold border-b-2 border-yellow-500/40 pb-6">
              WINNER: {winnerName}
            </h2>

            <div className="my-8 p-6 border-2 border-yellow-500/50 bg-yellow-500/5">
              <h3 className="text-lg text-yellow-400 uppercase tracking-wide mb-3 text-center">
                Judge Punchline
              </h3>
              <p className="text-3xl leading-relaxed text-center font-bold text-arena-text">
                "{verdict.punchline_reasoning}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`p-6 border-2 ${verdict.winner_id === fighterAId ? "border-arena-green" : "border-arena-red"}`}
              >
                <h3 className="text-2xl font-bold mb-4 uppercase text-gray-300">
                  {fighterA.name} Critique
                </h3>
                <p className="text-xl leading-relaxed text-gray-200">
                  {verdict.fighter_a_critique}
                </p>
              </div>

              <div
                className={`p-6 border-2 ${verdict.winner_id === fighterBId ? "border-arena-green" : "border-arena-red"}`}
              >
                <h3 className="text-2xl font-bold mb-4 uppercase text-gray-300">
                  {fighterB.name} Critique
                </h3>
                <p className="text-xl leading-relaxed text-gray-200">
                  {verdict.fighter_b_critique}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-yellow-500/30 flex flex-col md:flex-row gap-4 md:justify-end">
              <button
                type="button"
                onClick={() => setShowVerdictModal(false)}
                className="px-6 py-3 text-xl border-2 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-black transition-colors"
              >
                CLOSE & REVIEW DEBATE
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="px-6 py-3 text-xl border-2 border-arena-green text-arena-green hover:bg-arena-green hover:text-black transition-colors"
              >
                NEW DUEL
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
