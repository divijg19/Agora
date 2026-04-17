import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
  const {
    status,
    currentSpeaker,
    currentIntent,
    rawText,
    networkTurns,
    visualTurnIndex,
    advanceVisualTurn,
    verdict,
    turnCount,
    errorMessage,
  } = useEngineStream(matchId);
  const [showVerdictModal, setShowVerdictModal] = useState(true);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeakerVisual, setActiveSpeakerVisual] = useState<string | null>(
    null,
  );
  const [activeIntentVisual, setActiveIntentVisual] = useState<string | null>(
    null,
  );
  const [isIntroPlaying, setIsIntroPlaying] = useState(true);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroPlaying(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

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

  const isASpeaking = status !== "error" && activeSpeakerVisual === fighterA.id;
  const isBSpeaking = status !== "error" && activeSpeakerVisual === fighterB.id;
  const isJudge = status !== "error" && activeSpeakerVisual === "judge";

  let speakerName = null;
  if (isASpeaking) speakerName = fighterA.name;
  if (isBSpeaking) speakerName = fighterB.name;
  if (isJudge) speakerName = "THE JUDGE";

  // Calculate HP for game feel (Loser drops to 0 at the end)
  const hasBufferedTurnAhead = visualTurnIndex < networkTurns.length - 1;
  const isComplete =
    status === "completed" &&
    verdict !== null &&
    !hasBufferedTurnAhead &&
    !isTyping;
  const modalOpen = isComplete && showVerdictModal;
  const fighterABorderClass = fighterA.color.replace("bg-", "border-");
  const fighterBBorderClass = fighterB.color.replace("bg-", "border-");
  const fighterALeftBorderClass = fighterA.color.replace("bg-", "border-l-");
  const fighterBRightBorderClass = fighterB.color.replace("bg-", "border-r-");
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
      <AnimatePresence>
        {!isIntroPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
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
          </motion.div>
        )}
      </AnimatePresence>

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
          isIntroPlaying={isIntroPlaying}
        />

        {/* VS or Judge Graphic */}
        <div className="absolute left-1/2 bottom-20 -translate-x-1/2 flex flex-col items-center z-50 pointer-events-none">
          {status === "judging" && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity }}
              className="text-4xl text-yellow-500 font-bold mb-4 drop-shadow-[0_0_10px_#eab308]"
            >
              EVALUATING...
            </motion.div>
          )}

          {/* The Explosive VS Slam (Only during intro) */}
          {isIntroPlaying && (
            <motion.h1
              initial={{ scale: 10, opacity: 0 }}
              animate={{ scale: 1, opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2.5,
                times: [0, 0.2, 0.8, 1],
                ease: ["easeIn", "easeOut", "easeIn", "easeOut"],
              }}
              className="text-9xl text-arena-red italic font-bold drop-shadow-[0_0_30px_rgba(255,60,60,1)]"
            >
              VS
            </motion.h1>
          )}
        </div>

        <FighterSprite
          fighter={fighterB}
          isActive={isBSpeaking}
          facing="left"
          hp={hpB}
          currentIntent={activeIntentVisual}
          isIntroPlaying={isIntroPlaying}
        />
      </div>

      {/* The Dialogue & Verdict Area */}
      <AnimatePresence>
        {!isIntroPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative z-20"
          >
            {!isComplete ? (
              <DialogueBox
                speakerName={speakerName}
                rawText={rawText}
                isJudge={isJudge}
                onTypingChange={setIsTyping}
                onTypingComplete={() => {
                  if (visualTurnIndex < networkTurns.length - 1) {
                    if (advanceTimerRef.current) {
                      clearTimeout(advanceTimerRef.current);
                    }

                    advanceTimerRef.current = setTimeout(() => {
                      advanceVisualTurn();
                      advanceTimerRef.current = null;
                    }, 1500);
                  }
                }}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {isComplete && showVerdictModal && verdict && (
        <div
          className={`absolute inset-0 z-40 flex items-center justify-center p-4 ${
            !userVote ? "bg-black/90 backdrop-blur-sm" : "bg-black/80"
          }`}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-5xl border-4 border-yellow-500 bg-black p-6 md:p-8 shadow-[0_0_30px_rgba(234,179,8,0.25)] max-h-[70vh] overflow-y-auto"
          >
            {!userVote ? (
              <div className="flex flex-col items-center py-2 md:py-6">
                <h2 className="text-3xl md:text-4xl text-arena-text mb-2 tracking-widest uppercase text-center">
                  THE DEBATE HAS CONCLUDED
                </h2>
                <p className="text-xl text-yellow-500 mb-8 animate-pulse text-center">
                  WHO WON? CAST YOUR VOTE.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <motion.button
                    type="button"
                    onClick={() => setUserVote(fighterA.id)}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`px-8 py-6 border-[6px] ${fighterABorderClass} bg-neutral-900 hover:bg-neutral-800 transition-colors flex flex-col items-center w-full`}
                  >
                    <span className="text-5xl mb-2">{fighterA.avatar}</span>
                    <span className="text-xl font-bold uppercase">
                      {fighterA.name}
                    </span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setUserVote(fighterB.id)}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`px-8 py-6 border-[6px] ${fighterBBorderClass} bg-neutral-900 hover:bg-neutral-800 transition-colors flex flex-col items-center w-full`}
                  >
                    <span className="text-5xl mb-2">{fighterB.avatar}</span>
                    <span className="text-xl font-bold uppercase">
                      {fighterB.name}
                    </span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center border-b-2 border-yellow-500/30 pb-4 mb-6">
                  <h2 className="text-3xl md:text-4xl text-yellow-500 text-center grow uppercase">
                    Winner: {winnerName}
                  </h2>
                  <div
                    className={`px-4 py-2 border-2 uppercase font-bold ${userVote === verdict.winner_id ? "border-arena-green text-arena-green" : "border-arena-red text-arena-red"}`}
                  >
                    {userVote === verdict.winner_id
                      ? "YOU AGREED"
                      : "JUDGE DISAGREES"}
                  </div>
                </div>

                <p className="text-xl md:text-2xl mb-8 leading-relaxed text-center font-bold">
                  "{verdict.punchline_reasoning}"
                </p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div
                    className={`p-4 border-2 ${verdict.winner_id === fighterA.id ? "border-arena-green" : "border-arena-red"}`}
                  >
                    <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                      {fighterA.name} Critique:
                    </h3>
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {verdict.fighter_a_critique}
                    </p>
                  </div>
                  <div
                    className={`p-4 border-2 ${verdict.winner_id === fighterB.id ? "border-arena-green" : "border-arena-red"}`}
                  >
                    <h3 className="text-xl font-bold mb-2 uppercase text-gray-400">
                      {fighterB.name} Critique:
                    </h3>
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {verdict.fighter_b_critique}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowVerdictModal(false)}
                    className="px-6 py-3 border-2 border-gray-400 text-gray-300 hover:text-white hover:border-white transition-colors uppercase"
                  >
                    CLOSE & REVIEW DEBATE
                  </button>
                  <button
                    type="button"
                    onClick={onRestart}
                    className="px-6 py-3 border-2 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-white transition-colors font-bold uppercase"
                  >
                    START NEW DUEL
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {isComplete && !showVerdictModal && (
        <div className="absolute inset-0 bg-black/95 z-50 overflow-y-auto p-10">
          <div className="sticky top-0 bg-black/95 pb-6 mb-6 border-b-2 border-arena-border flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl md:text-4xl text-arena-text font-bold uppercase">
              Debate Playback Review
            </h2>
            <button
              type="button"
              onClick={onRestart}
              className="px-8 py-4 border-4 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-white transition-colors text-2xl font-bold uppercase"
            >
              START NEW DUEL
            </button>
          </div>

          <div className="space-y-6 pb-6">
            {networkTurns.map((turn) => {
              const isSpeakerA = turn.speaker_id === fighterA.id;
              const speakerLabel = isSpeakerA
                ? fighterA.name
                : turn.speaker_id === fighterB.id
                  ? fighterB.name
                  : turn.speaker_id;

              return (
                <div
                  key={turn.id}
                  className={`max-w-4xl ${
                    isSpeakerA
                      ? `mr-auto text-left border-l-4 pl-4 ${fighterALeftBorderClass}`
                      : `ml-auto text-right border-r-4 pr-4 ${fighterBRightBorderClass}`
                  }`}
                >
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                    {speakerLabel}
                  </p>
                  <p className="text-xl leading-relaxed whitespace-pre-wrap bg-black/70 p-4">
                    {turn.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Catastrophic Error Overlay */}
      {status === "error" && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm border-4 border-arena-red">
          <h1 className="text-6xl text-arena-red font-bold mb-6 tracking-widest uppercase animate-pulse">
            CONNECTION LOST
          </h1>
          <p className="text-2xl text-gray-300 mb-10 max-w-lg text-center">
            {errorMessage ??
              "The neural link to the Arena Engine has been severed. The debate cannot continue."}
          </p>
          <button
            type="button"
            onClick={onRestart}
            className="px-8 py-4 border-4 border-arena-red text-arena-red hover:bg-arena-red hover:text-black transition-colors font-bold text-2xl uppercase"
          >
            ABORT MATCH
          </button>
        </div>
      )}
    </motion.div>
  );
}
