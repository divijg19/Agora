import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useEngineStream } from "../hooks/useEngineStream";
import type { FighterDef } from "../types/fighter";
import { DialogueBox } from "./DialogueBox";
import { FighterSprite } from "./FighterSprite";

interface CombatScreenProps {
  matchId: string;
  topic: string;
  fighterA: FighterDef;
  fighterB: FighterDef;
  onRestart: () => void;
}

export function CombatScreen({
  matchId,
  topic,
  fighterA,
  fighterB,
  onRestart,
}: CombatScreenProps) {
  const { status, currentSpeaker, currentIntent, rawText, verdict, turnCount } =
    useEngineStream(matchId);
  const [showVerdictModal, setShowVerdictModal] = useState(true);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeakerVisual, setActiveSpeakerVisual] = useState<string | null>(
    null,
  );
  const [activeIntentVisual, setActiveIntentVisual] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isTyping) {
      setActiveSpeakerVisual(currentSpeaker);
      setActiveIntentVisual(currentIntent);
    }
  }, [currentSpeaker, currentIntent, isTyping]);

  useEffect(() => {
    if (status === "completed") {
      setShowVerdictModal(true);
      setUserVote(null);
    }
  }, [status]);

  const isASpeaking = activeSpeakerVisual === fighterA.id;
  const isBSpeaking = activeSpeakerVisual === fighterB.id;
  const isJudge = activeSpeakerVisual === "judge";

  let speakerName = null;
  if (isASpeaking) speakerName = fighterA.name;
  if (isBSpeaking) speakerName = fighterB.name;
  if (isJudge) speakerName = "THE JUDGE";

  // Calculate HP for game feel (Loser drops to 0 at the end)
  const isComplete = status === "completed" && verdict !== null;
  const modalOpen = isComplete && userVote !== null && showVerdictModal;
  const hpA =
    isComplete && userVote
      ? verdict.winner_id === fighterA.id
        ? 100
        : 0
      : 100;
  const hpB =
    isComplete && userVote
      ? verdict.winner_id === fighterB.id
        ? 100
        : 0
      : 100;
  const winnerName =
    isComplete && verdict.winner_id === fighterA.id
      ? fighterA.name
      : isComplete && verdict.winner_id === fighterB.id
        ? fighterB.name
        : "UNKNOWN";
  const isAttack =
    (isASpeaking || isBSpeaking) &&
    (activeIntentVisual === "counter" || activeIntentVisual === "rebuttal");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={
        isAttack
          ? { x: [-5, 5, -5, 5, 0], y: [-2, 2, -2, 2, 0], opacity: 1 }
          : { x: 0, y: 0, opacity: 1 }
      }
      transition={isAttack ? { duration: 0.4 } : { duration: 0.5 }}
      className="max-w-6xl w-full mx-auto p-4 flex flex-col justify-between h-[85vh] relative z-10"
    >
      {/* 3D Synthwave Grid Background (Pure CSS) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-20">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-linear-to-t from-arena-blue/30 to-transparent" />
        <div
          className="w-full h-[50vh] absolute bottom-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(60, 130, 255, 0.4) 2px, transparent 2px), linear-gradient(90deg, rgba(60, 130, 255, 0.4) 2px, transparent 2px)",
            backgroundSize: "40px 40px",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "bottom center",
          }}
        />
      </div>

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
          currentIntent={activeIntentVisual}
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
          currentIntent={activeIntentVisual}
        />
      </div>

      {/* The Dialogue & Verdict Area */}
      {isComplete ? (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-4 border-yellow-500 bg-black p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] max-h-[40vh] overflow-y-auto w-full relative z-20"
        >
          {/* Stage 1: The User Vote */}
          {!userVote ? (
            <div className="flex flex-col items-center py-4">
              <h2 className="text-4xl text-arena-text mb-2 tracking-widest uppercase">
                THE DEBATE HAS CONCLUDED
              </h2>
              <p className="text-xl text-yellow-500 mb-8 animate-pulse">
                WHO WON? CAST YOUR VOTE.
              </p>

              <div className="flex gap-8 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setUserVote(fighterA.id)}
                  className={`px-8 py-6 border-4 ${fighterA.color.replace("bg-", "border-")} hover:bg-gray-800 transition-colors flex flex-col items-center w-64`}
                >
                  <span className="text-4xl mb-2">{fighterA.avatar}</span>
                  <span className="text-xl font-bold uppercase">
                    {fighterA.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserVote(fighterB.id)}
                  className={`px-8 py-6 border-4 ${fighterB.color.replace("bg-", "border-")} hover:bg-gray-800 transition-colors flex flex-col items-center w-64`}
                >
                  <span className="text-4xl mb-2">{fighterB.avatar}</span>
                  <span className="text-xl font-bold uppercase">
                    {fighterB.name}
                  </span>
                </button>
              </div>
            </div>
          ) : showVerdictModal ? (
            /* Stage 2: The Final Reveal */
            <>
              <div className="flex justify-between items-center border-b-2 border-yellow-500/30 pb-4 mb-6">
                <h2 className="text-4xl text-yellow-500 text-center grow">
                  🏆 WINNER: {winnerName} 🏆
                </h2>
                {/* User Vote Comparison Badge */}
                <div
                  className={`px-4 py-2 border-2 uppercase font-bold ${userVote === verdict.winner_id ? "border-arena-green text-arena-green" : "border-arena-red text-arena-red"}`}
                >
                  {userVote === verdict.winner_id
                    ? "YOU AGREED"
                    : "JUDGE DISAGREES"}
                </div>
              </div>

              <p className="text-2xl mb-8 leading-relaxed text-center font-bold">
                "{verdict.punchline_reasoning}"
              </p>

              {/* Critique Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div
                  className={`p-4 border-2 ${verdict.winner_id === fighterA.id ? "border-arena-green" : "border-arena-red"}`}
                >
                  <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                    {fighterA.name} Critique:
                  </h3>
                  <p className="text-lg text-gray-300">
                    {verdict.fighter_a_critique}
                  </p>
                </div>
                <div
                  className={`p-4 border-2 ${verdict.winner_id === fighterB.id ? "border-arena-green" : "border-arena-red"}`}
                >
                  <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                    {fighterB.name} Critique:
                  </h3>
                  <p className="text-lg text-gray-300">
                    {verdict.fighter_b_critique}
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowVerdictModal(false)}
                  className="px-6 py-2 border-2 border-gray-400 text-gray-400 hover:text-white hover:border-white transition-colors"
                >
                  REVIEW TRANSCRIPT
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="px-6 py-2 border-2 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-white transition-colors font-bold"
                >
                  NEW DUEL
                </button>
              </div>
            </>
          ) : (
            /* Stage 3: Review Mode */
            <div className="text-center py-8">
              <h2 className="text-3xl text-gray-400 mb-6">DEBATE CONCLUDED</h2>
              <p className="text-xl mb-8">The transcript is available above.</p>
              <button
                type="button"
                onClick={onRestart}
                className="px-8 py-3 border-2 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-white transition-colors text-xl font-bold"
              >
                START NEW DUEL
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="w-full relative z-20">
          <DialogueBox
            speakerName={speakerName}
            rawText={rawText}
            isJudge={isJudge}
            onTypingChange={setIsTyping}
          />
        </div>
      )}
    </motion.div>
  );
}
