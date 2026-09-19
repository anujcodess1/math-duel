import React from "react";
import type { GameOverStats, UserProfile } from "../types";
import {
  TrophyIcon,
  SwordsIcon,
  HandshakeIcon,
  ChevronLeftIcon,
  BadgeIcon,
} from "./Icons";
import { calculateBadges, renderBadgeIcon } from "../badgeUtils";

interface GameOverModalProps {
  user: UserProfile;
  stats: GameOverStats;
  onPlayAgain: () => void;
  onBackToDashboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  user,
  stats,
  onPlayAgain,
  onBackToDashboard,
}) => {
  const isP1 = stats.p1.id === user.id;
  const myStats = isP1 ? stats.p1 : stats.p2;
  const oppStats = isP1 ? stats.p2 : stats.p1;

  const isWinner = stats.winnerId === user.id;
  const isDraw = stats.winnerId === null;

  const eloDelta = isWinner ? 25 : isDraw ? 5 : -15;

  const myTotalAnswers = (myStats.correct || 0) + (myStats.wrong || 0) + (myStats.timeouts || 0);
  const myAccuracy = myTotalAnswers > 0 ? Math.round(((myStats.correct || 0) / myTotalAnswers) * 100) : 0;

  const oppTotalAnswers = (oppStats.correct || 0) + (oppStats.wrong || 0) + (oppStats.timeouts || 0);

  const updatedUserStats = {
    rating: Math.max(0, user.rating + eloDelta),
    gamesPlayed: user.gamesPlayed + 1,
    wins: user.wins + (isWinner ? 1 : 0),
    losses: user.losses + (!isWinner && !isDraw ? 1 : 0),
    draws: user.draws + (isDraw ? 1 : 0),
  };

  const allBadges = calculateBadges(updatedUserStats);
  const previousBadges = calculateBadges(user);

  const newlyUnlockedBadges = allBadges.filter((badge) => {
    const prev = previousBadges.find((p) => p.id === badge.id);
    return badge.unlocked && (!prev || !prev.unlocked);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 text-center flex flex-col gap-6 shadow-dark-card my-auto">
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isWinner
                ? "bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/40 ring-4 ring-[#84cc16]/10"
                : isDraw
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 ring-4 ring-amber-500/10"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40 ring-4 ring-rose-500/10"
            }`}
          >
            {isWinner ? (
              <TrophyIcon className="w-8 h-8" />
            ) : isDraw ? (
              <HandshakeIcon className="w-8 h-8" />
            ) : (
              <SwordsIcon className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            {isWinner ? "Victory!" : isDraw ? "Match Draw" : "Defeat"}
          </h2>

          <p className="text-xs text-zinc-400 max-w-sm">
            {isWinner
              ? "Flawless performance! You dominated the 1v1 math battle."
              : isDraw
              ? "Equal scores at the final buzzer. Well contested duel!"
              : "Good effort! Practice more rapid questions to climb the ranks."}
          </p>
        </div>

        <div className="bg-[#171717] border border-[#282828] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-14 h-14 rounded-full bg-[#84cc16] text-black font-extrabold text-lg flex items-center justify-center shadow-md ring-2 ring-[#84cc16]/50">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-white max-w-[110px] truncate">
                {user.username} <span className="text-[#84cc16] font-semibold">(YOU)</span>
              </span>
              <div className="text-4xl font-extrabold font-mono text-[#84cc16] mt-0.5">
                {myStats.score}
              </div>
              <div
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  eloDelta > 0
                    ? "bg-[#84cc16]/10 text-[#84cc16] border-[#84cc16]/30"
                    : "bg-rose-950/60 text-rose-400 border-rose-800"
                }`}
              >
                {eloDelta > 0 ? `+${eloDelta}` : eloDelta} ELO
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 px-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">VS</span>
              <div className="w-px h-16 bg-[#2b2b2b]" />
            </div>

            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-14 h-14 rounded-full bg-[#202020] text-zinc-300 border border-[#333333] font-extrabold text-lg flex items-center justify-center shadow-md">
                {oppStats.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-zinc-300 max-w-[110px] truncate">
                {oppStats.username}
              </span>
              <div className="text-4xl font-extrabold font-mono text-zinc-300 mt-0.5">
                {oppStats.score}
              </div>
              <div
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  -eloDelta > 0
                    ? "bg-[#84cc16]/10 text-[#84cc16] border-[#84cc16]/30"
                    : "bg-rose-950/60 text-rose-400 border-rose-800"
                }`}
              >
                {-eloDelta > 0 ? `+${-eloDelta}` : -eloDelta} ELO
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#262626] text-center text-xs">
            <div className="bg-[#121212] p-2.5 rounded-xl border border-[#242424]">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Correct</div>
              <div className="text-base font-extrabold font-mono text-[#84cc16] mt-0.5">
                {myStats.correct || 0}
              </div>
            </div>
            <div className="bg-[#121212] p-2.5 rounded-xl border border-[#242424]">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Wrong</div>
              <div className="text-base font-extrabold font-mono text-rose-400 mt-0.5">
                {myStats.wrong || 0}
              </div>
            </div>
            <div className="bg-[#121212] p-2.5 rounded-xl border border-[#242424]">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Accuracy</div>
              <div className="text-base font-extrabold font-mono text-white mt-0.5">
                {myAccuracy}%
              </div>
            </div>
          </div>
        </div>

        {newlyUnlockedBadges.length > 0 && (
          <div className="bg-[#84cc16]/10 border border-[#84cc16]/40 rounded-2xl p-4 text-left flex flex-col gap-2.5 animate-bounce-short">
            <div className="flex items-center gap-2 text-[#84cc16] text-xs font-bold uppercase tracking-wider">
              <BadgeIcon className="w-4 h-4 text-[#84cc16]" />
              <span>New Badge Unlocked!</span>
            </div>
            <div className="space-y-2">
              {newlyUnlockedBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 bg-[#121212]/90 p-2.5 rounded-xl border border-[#84cc16]/30">
                  <div className="w-9 h-9 rounded-lg bg-[#84cc16] text-black flex items-center justify-center shrink-0">
                    {renderBadgeIcon(badge.iconName, "w-5 h-5")}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{badge.title}</div>
                    <div className="text-[11px] text-zinc-400">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lime-glow flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <SwordsIcon className="w-4 h-4" />
            <span>Play Again</span>
          </button>
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 rounded-xl bg-[#181818] hover:bg-[#242424] border border-[#2b2b2b] text-zinc-300 hover:text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Back To Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
