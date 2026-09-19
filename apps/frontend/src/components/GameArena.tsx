import React, { useEffect, useState, useRef } from "react";
import type { QuestionData, Opponent, UserProfile } from "../types";
import { FlameIcon, EnterIcon } from "./Icons";

interface GameArenaProps {
  user: UserProfile;
  opponent: Opponent;
  question: QuestionData | null;
  matchSecondsRemaining: number;
  userScore: number;
  opponentScore: number;
  streak: number;
  lastFeedback: {
    type: "CORRECT" | "WRONG" | "TIMEOUT" | null;
    message: string;
    delta: number;
  } | null;
  onSubmitAnswer: (questionId: string, answer: number) => void;
  onLeaveGame: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  user,
  opponent,
  question,
  matchSecondsRemaining,
  userScore,
  opponentScore,
  streak,
  lastFeedback,
  onSubmitAnswer,
  onLeaveGame,
}) => {
  const [questionTimeLeft, setQuestionTimeLeft] = useState(5.0);
  const [answerInput, setAnswerInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedQuestionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!question) return;
    selectedQuestionIdRef.current = null;
    setAnswerInput("");
    setQuestionTimeLeft(5.0);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setQuestionTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [question?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current) {
        if (/^[0-9\-]$/.test(e.key) || e.key === "Backspace") {
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAnswerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question || selectedQuestionIdRef.current === question.id) return;

    const trimmed = answerInput.trim();
    if (trimmed === "" || trimmed === "-") return;

    const parsedNumber = parseInt(trimmed, 10);
    if (isNaN(parsedNumber)) return;

    selectedQuestionIdRef.current = question.id;
    onSubmitAnswer(question.id, parsedNumber);
    setAnswerInput("");
  };

  const questionProgressPercent = Math.max(0, Math.min(100, (questionTimeLeft / 5.0) * 100));

  return (
    <div className="min-h-screen w-full flex flex-col justify-between py-6 px-4 max-w-2xl mx-auto select-none">
      {/* Top Bar: Strictly Leave Game Button and Match Timer */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-[#222222]">
        <button
          onClick={onLeaveGame}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141414] hover:bg-rose-950/80 border border-[#2b2b2b] hover:border-rose-800 text-zinc-400 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm group"
          title="Forfeit and exit the current match"
        >
          <svg
            className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Leave Game</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#262626]">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Time</span>
          <span
            className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded-full ${
              matchSecondsRemaining <= 10
                ? "bg-rose-950 text-rose-300 border border-rose-800 animate-pulse"
                : "bg-[#181818] text-zinc-200"
            }`}
          >
            {matchSecondsRemaining}s
          </span>
        </div>
      </div>

      {/* Profile Pictures & Scores Row */}
      <div className="w-full grid grid-cols-2 gap-4 py-4">
        {/* User Profile */}
        <div className="flex items-center gap-3.5 bg-[#121212]/90 border border-[#262626] p-3.5 sm:p-4 rounded-2xl shadow-dark-card">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#181818] border-2 border-[#84cc16] shadow-[0_0_15px_rgba(132,204,22,0.3)] flex items-center justify-center font-bold text-lg text-white">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`}
                alt={user.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <span className="absolute text-[#84cc16] font-extrabold text-lg">
                {user.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
            {streak >= 3 && (
              <span className="absolute -bottom-1 -right-1 text-[11px] bg-black/95 px-1.5 py-0.5 rounded-full border border-amber-500 text-amber-400 font-bold flex items-center gap-0.5 shadow-md">
                <FlameIcon className="w-3 h-3 text-amber-400" />
                <span>{streak}</span>
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-white truncate">{user.username} (You)</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#84cc16] tracking-tight">{userScore}</div>
          </div>
        </div>

        {/* Opponent Profile */}
        <div className="flex items-center gap-3.5 bg-[#121212]/90 border border-[#262626] p-3.5 sm:p-4 rounded-2xl shadow-dark-card flex-row-reverse text-right">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#181818] border-2 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center justify-center font-bold text-lg text-white">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(opponent.username)}`}
                alt={opponent.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <span className="absolute text-rose-400 font-extrabold text-lg">
                {opponent.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-zinc-300 truncate">{opponent.username}</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-300 tracking-tight">{opponentScore}</div>
          </div>
        </div>
      </div>

      {/* The Question & Answer Arena */}
      <div className="w-full bg-[#121212]/95 border border-[#262626] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 text-center relative shadow-dark-card my-auto">
        <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear rounded-full ${
              questionTimeLeft > 2.0 ? "bg-[#84cc16]" : "bg-rose-500"
            }`}
            style={{ width: `${questionProgressPercent}%` }}
          />
        </div>

        {question ? (
          <>
            <div className="py-4 relative">
              <h1 className="text-5xl sm:text-6xl font-extrabold font-mono text-white tracking-wide">
                {question.text} = ?
              </h1>

              {lastFeedback && (
                <div
                  className={`absolute -top-1 right-1 font-mono font-bold text-xs px-3 py-1 rounded-full ${
                    lastFeedback.type === "CORRECT"
                      ? "bg-emerald-950 text-[#84cc16] border border-[#84cc16]/50"
                      : "bg-rose-950 text-rose-300 border border-rose-700"
                  }`}
                >
                  {lastFeedback.delta > 0 ? `+${lastFeedback.delta}` : lastFeedback.delta}
                </div>
              )}
            </div>

            <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-4 w-full">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
                placeholder="Type answer..."
                value={answerInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^-?\d*$/.test(val)) {
                    setAnswerInput(val);
                  }
                }}
                className="w-full text-center text-4xl sm:text-5xl font-mono font-extrabold tracking-wider px-4 py-4 bg-[#181818] border-2 border-[#2b2b2b] focus:border-[#84cc16] focus:outline-none rounded-xl text-white placeholder-zinc-600 transition-colors shadow-inner"
              />

              <button
                type="submit"
                disabled={answerInput.trim() === "" || answerInput === "-"}
                className="w-full py-4 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2 shadow-lime-glow active:scale-[0.99]"
              >
                <span>Submit Answer</span>
                <span className="text-xs bg-black text-[#84cc16] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <EnterIcon className="w-3 h-3" />
                  <span>Enter</span>
                </span>
              </button>

              <p className="text-xs text-zinc-500 font-medium">
                Type with your keyboard & press <kbd className="px-1.5 py-0.5 bg-[#1c1c1c] border border-[#333333] rounded text-white font-mono">Enter</kbd>
              </p>
            </form>
          </>
        ) : (
          <div className="py-14 text-zinc-500 font-mono text-sm">
            Preparing next equation...
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
};
