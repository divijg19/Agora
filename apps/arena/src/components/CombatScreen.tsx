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
  const [showVotePrompt, setShowVotePrompt] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const isTyping = false;
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
  }, [currentSpeaker, currentIntent]);

  useEffect(() => {
    if (status === "completed") {
      setShowVerdictModal(true);
      setShowVotePrompt(false);
      setUserVote(null);
    } else {
      setShowVotePrompt(false);
    }
  }, [status]);

  const isASpeaking = status !== "error" && activeSpeakerVisual === fighterA.id;
  const isBSpeaking = status !== "error" && activeSpeakerVisual === fighterB.id;
  const isJudge = status !== "error" && activeSpeakerVisual === "judge";

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
  const isKO = isComplete && userVote !== null;
  const fighterAId = fighterA.id;

  useEffect(() => {
    if (isComplete && !userVote) {
      const timer = setTimeout(() => setShowVotePrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, userVote]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={
        isKO
          ? {
              x: [-15, 15, -10, 10, -5, 5, 0],
              y: [-5, 5, -5, 5, 0],
              opacity: 1,
            }
          : isAttack
            ? { x: [-5, 5, -5, 5, 0], y: [-2, 2, -2, 2, 0], opacity: 1 }
            : { x: 0, y: 0, opacity: 1 }
      }
      transition={
        isKO
          ? { duration: 0.8, ease: "easeOut" }
          : isAttack
            ? { duration: 0.4 }
            : { duration: 0.5 }
      }
      className="max-w-6xl w-full mx-auto p-4 flex flex-col h-[85vh] relative z-10"
    >
      {/* 3D Synthwave Grid Background (Animated Camera Pan) */}
      <motion.div
        animate={{ opacity: isComplete || status === "judging" ? 0.05 : 0.2 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 overflow-hidden pointer-events-none -z-10"
      >
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-linear-to-t from-arena-blue/30 to-transparent" />

        {/* The Judge's Spotlight (Only visible during climax) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isComplete || status === "judging" ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.9) 60%, rgba(0,0,0,1) 100%)",
          }}
        />

        <motion.div
          className="w-[200%] h-[50vh] absolute bottom-0 -left-[50%]"
          animate={{
            x: isASpeaking ? "5%" : isBSpeaking ? "-5%" : "0%",
          }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
          style={{
            backgroundImage:
              "linear-gradient(rgba(60, 130, 255, 0.4) 2px, transparent 2px), linear-gradient(90deg, rgba(60, 130, 255, 0.4) 2px, transparent 2px)",
            backgroundSize: "40px 40px",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "bottom center",
          }}
        />
      </motion.div>

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
      <motion.div
        animate={{
          scale: isASpeaking || isBSpeaking ? 1.02 : 1,
          x: 0,
        }}
        transition={{ type: "spring", stiffness: 40, damping: 25 }}
        className={`flex items-start justify-between w-full h-full relative transition-all duration-300 ${
          modalOpen ? "opacity-60 blur-[1px]" : "opacity-100"
        }`}
      >
        <FighterSprite
          fighter={fighterA}
          isActive={isASpeaking}
          facing="right"
          hp={hpA}
          currentIntent={currentIntent}
          isIntroPlaying={isIntroPlaying}
          isBeingAttacked={isBSpeaking && isAttack}
          verdict={verdict}
          userVote={userVote}
        />

        {/* Dialogue for the Left */}
        {!isIntroPlaying && !isComplete && isASpeaking && (
          <div className="absolute left-[8%] top-4 z-70 w-[62%]">
            <DialogueBox
              speakerName={fighterA.name}
              rawText={rawText}
              isJudge={isJudge}
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
              speakerSide="left"
            />
          </div>
        )}

        {/* Dialogue for the Right */}
        {!isIntroPlaying && !isComplete && isBSpeaking && (
          <div className="absolute right-[8%] top-4 z-70 w-[62%]">
            <DialogueBox
              speakerName={fighterB.name}
              rawText={rawText}
              isJudge={isJudge}
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
              speakerSide="right"
            />
          </div>
        )}

        {/* Dialogue for the Judge */}
        {!isIntroPlaying && !isComplete && isJudge && (
          <div className="absolute left-1/2 top-4 z-70 w-[70%] -translate-x-1/2">
            <DialogueBox
              speakerName="THE JUDGE"
              rawText={rawText}
              isJudge={isJudge}
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
              speakerSide="right"
            />
          </div>
        )}

        {/* VS or Judge Graphic */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          {/* The Judge's Descent */}
          <AnimatePresence>
            {status === "judging" && (
              <motion.div
                initial={{ y: -500, opacity: 0, scale: 2 }}
                animate={{ y: -50, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 12, stiffness: 50 }}
                className="absolute left-1/2 bottom-32 -translate-x-1/2 flex flex-col items-center z-40 pointer-events-none"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                  className="text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] mb-6"
                >
                  ⚖️
                </motion.div>
                <h2 className="text-3xl text-white font-black tracking-[0.5em] uppercase drop-shadow-lg">
                  SILENCE
                </h2>
                <p className="text-xl text-yellow-500 tracking-widest mt-2 animate-pulse">
                  THE JUDGE IS DELIBERATING
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {status === "debating" && (
            <h1 className="text-6xl text-arena-red italic font-bold drop-shadow-[0_0_30px_rgba(255,60,60,1)] absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
              VS
            </h1>
          )}
        </div>

        <FighterSprite
          fighter={fighterB}
          isActive={isBSpeaking}
          facing="left"
          hp={hpB}
          currentIntent={currentIntent}
          isIntroPlaying={isIntroPlaying}
          isBeingAttacked={isASpeaking && isAttack}
          verdict={verdict}
          userVote={userVote}
        />
      </motion.div>

      {isComplete && showVerdictModal && verdict && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-md"
        >
          <div className="w-full max-w-5xl bg-gray-900 border-4 border-yellow-500 p-10 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-y-auto max-h-[90vh]">
            {!userVote && showVotePrompt ? (
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
            ) : userVote ? (
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
            ) : null}
          </div>
        </motion.div>
      )}

      {isComplete && !showVerdictModal && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md overflow-hidden">
          {/* Sticky Header */}
          <div className="flex justify-between items-center px-10 py-6 border-b-4 border-gray-800 bg-black/90 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <div>
              <h2 className="text-3xl text-gray-400 uppercase tracking-widest font-black">
                DEBATE TRANSCRIPT
              </h2>
              <p className="text-lg text-gray-500 mt-1">Topic: {topic}</p>
            </div>
            <button
              type="button"
              onClick={onRestart}
              className="px-8 py-4 border-4 border-arena-blue text-arena-blue hover:bg-arena-blue hover:text-black transition-all text-xl font-bold tracking-widest"
            >
              START NEW DUEL
            </button>
          </div>

          {/* Scrollable Timeline Area */}
          <div className="flex-1 overflow-y-auto p-10 relative">
            {/* The Center Spine */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gray-800 opacity-50 z-0" />

            <div className="flex flex-col gap-16 max-w-5xl mx-auto relative z-10 py-10">
              {networkTurns.map((turn, index) => {
                const isFighterA = turn.speaker_id === fighterAId;
                const speakerName = isFighterA ? fighterA.name : fighterB.name;
                const borderColor = isFighterA
                  ? fighterA.color.replace("bg-", "border-")
                  : fighterB.color.replace("bg-", "border-");
                const textColor = isFighterA
                  ? fighterA.color.replace("bg-", "text-")
                  : fighterB.color.replace("bg-", "text-");

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={turn.id}
                    className={`flex w-full relative ${isFighterA ? "justify-start" : "justify-end"}`}
                  >
                    {/* The Timeline Node (Dot on the center spine) */}
                    <div
                      className="absolute left-1/2 top-8 -translate-x-1/2 w-6 h-6 rounded-full bg-black border-4 z-20 shadow-[0_0_15px_rgba(0,0,0,1)]"
                      style={{
                        borderColor: isFighterA ? "#3c82ff" : "#ff3c3c",
                      }}
                    />

                    {/* The Argument Card */}
                    <div
                      className={`w-[45%] flex flex-col ${isFighterA ? "items-end text-right" : "items-start text-left"}`}
                    >
                      {/* Metadata */}
                      <div
                        className={`text-sm font-mono tracking-widest uppercase mb-2 ${textColor} flex items-center gap-3`}
                      >
                        {isFighterA && (
                          <span className="opacity-50">[{turn.intent}]</span>
                        )}
                        <span className="font-bold text-xl">{speakerName}</span>
                        {!isFighterA && (
                          <span className="opacity-50">[{turn.intent}]</span>
                        )}
                      </div>

                      {/* Text Body */}
                      <div
                        className={`text-xl leading-relaxed text-gray-200 p-8 bg-gray-900/80 backdrop-blur-sm border-t-4 shadow-2xl ${borderColor}`}
                      >
                        {turn.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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
