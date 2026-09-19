import React, { useState } from "react";
import type { UserProfile } from "../types";
import { SwordsIcon, BadgeIcon, CheckIcon } from "./Icons";
import { calculateBadges, renderBadgeIcon } from "../badgeUtils";

interface ProfilePageProps {
  user: UserProfile;
  onNavigateToDashboard: () => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onNavigateToDashboard,
  onLogout,
}) => {
  const [filter, setFilter] = useState<"ALL" | "UNLOCKED" | "LOCKED">("ALL");

  const winRate =
    user.gamesPlayed > 0
      ? Math.round((user.wins / user.gamesPlayed) * 100)
      : 0;

  const getRankInfo = (rating: number) => {
    if (rating >= 600) {
      return { tier: "GRANDMASTER", nextTier: "MAX", min: 600, max: 1000, color: "text-amber-400 border-amber-500/50 bg-amber-950/40" };
    }
    if (rating >= 350) {
      return { tier: "DIAMOND SAGE", nextTier: "GRANDMASTER", min: 350, max: 600, color: "text-[#84cc16] border-[#84cc16]/50 bg-[#84cc16]/10" };
    }
    if (rating >= 150) {
      return { tier: "GOLD TACTICIAN", nextTier: "DIAMOND SAGE", min: 150, max: 350, color: "text-amber-300 border-amber-700/50 bg-amber-950/30" };
    }
    if (rating >= 50) {
      return { tier: "SILVER DUELIST", nextTier: "GOLD TACTICIAN", min: 50, max: 150, color: "text-zinc-200 border-zinc-700 bg-zinc-900" };
    }
    return { tier: "RECRUIT", nextTier: "SILVER DUELIST", min: 0, max: 50, color: "text-zinc-400 border-zinc-800 bg-zinc-950" };
  };

  const rank = getRankInfo(user.rating);
  const rankProgress = rank.nextTier !== "MAX"
    ? Math.max(0, Math.min(100, Math.round(((user.rating - rank.min) / (rank.max - rank.min)) * 100)))
    : 100;

  const achievements = calculateBadges(user);

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "UNLOCKED") return a.unlocked;
    if (filter === "LOCKED") return !a.unlocked;
    return true;
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalAchievements = achievements.length;
  const overallProgress = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-dark-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#84cc16] flex items-center justify-center font-extrabold text-black text-3xl shadow-lime-glow">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {user.username}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${rank.color}`}>
                  {rank.tier}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono font-bold text-[#84cc16] bg-black border border-[#84cc16]/40 px-2 py-0.5 rounded">
                  {user.rating} ELO Rating
                </span>
                <span className="text-xs text-zinc-400">
                  · {unlockedCount}/{totalAchievements} Badges Unlocked
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:self-start">
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-black text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lime-glow active:scale-[0.99] flex items-center gap-1.5"
            >
              <SwordsIcon className="w-4 h-4" />
              <span>Back to Arena</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-2.5 rounded-xl bg-[#181818] hover:bg-rose-950/40 border border-[#262626] hover:border-rose-800 text-zinc-400 hover:text-rose-400 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {rank.nextTier !== "MAX" && (
          <div className="p-4 bg-[#181818] border border-[#262626] rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">
                Next Rank: <strong className="text-white font-bold">{rank.nextTier}</strong>
              </span>
              <span className="text-white font-bold">
                {user.rating} / {rank.max} ELO ({rankProgress}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#121212] rounded-full overflow-hidden border border-[#262626]">
              <div
                className="h-full bg-[#84cc16] rounded-full transition-all duration-500"
                style={{ width: `${rankProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-5 rounded-xl shadow-dark-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Battles</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{user.gamesPlayed}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Duels Fought</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-5 rounded-xl shadow-dark-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Record (W/L/D)</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {user.wins} <span className="text-zinc-600 font-normal">/</span>{" "}
            <span className="text-white">{user.losses}</span>{" "}
            <span className="text-zinc-600 font-normal">/</span>{" "}
            <span className="text-zinc-400">{user.draws}</span>
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Match Record</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-5 rounded-xl shadow-dark-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Win Rate</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{winRate}%</div>
          <div className="text-xs text-zinc-500 mt-0.5">Victory Rate</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-5 rounded-xl shadow-dark-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Mastery Level</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            LVL {Math.max(1, Math.floor(user.gamesPlayed / 3) + 1)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Duelist Rank Tier</div>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-dark-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
          <div>
            <div className="flex items-center gap-2.5">
              <BadgeIcon className="w-5 h-5 text-[#84cc16]" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Task Achievements & Badges
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Unlock badges by completing duels, maintaining streaks, and reaching milestones.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#262626] text-xs">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                filter === "ALL" ? "bg-[#84cc16] text-black shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              ALL ({totalAchievements})
            </button>
            <button
              onClick={() => setFilter("UNLOCKED")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                filter === "UNLOCKED" ? "bg-[#84cc16] text-black shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              UNLOCKED ({unlockedCount})
            </button>
            <button
              onClick={() => setFilter("LOCKED")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                filter === "LOCKED" ? "bg-[#84cc16] text-black shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              LOCKED ({totalAchievements - unlockedCount})
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-[#181818] border border-[#262626] rounded-xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-medium">
              Badge Collection: <strong className="text-white font-bold">{unlockedCount} of {totalAchievements} Unlocked</strong>
            </span>
            <span className="text-white font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden border border-[#262626]">
            <div
              className="h-full bg-[#84cc16] rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAchievements.map((badge) => {
            const progressPercent = Math.min(100, Math.round((badge.current / badge.max) * 100));

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  badge.unlocked
                    ? "bg-[#84cc16]/10 border-[#84cc16]/40 shadow-xs"
                    : "bg-[#141414] border-[#222222] opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      badge.unlocked ? "bg-[#84cc16] text-black" : "bg-[#202020] text-zinc-500"
                    }`}>
                      {renderBadgeIcon(badge.iconName, "w-5 h-5")}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        badge.unlocked
                          ? "bg-[#84cc16] text-black font-extrabold"
                          : "bg-[#1f1f1f] text-zinc-400 border border-[#2b2b2b]"
                      }`}
                    >
                      {badge.unlocked && <CheckIcon className="w-3 h-3 text-black" />}
                      <span>{badge.unlocked ? "UNLOCKED" : "LOCKED"}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{badge.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{badge.description}</p>
                </div>

                <div className="pt-2 border-t border-[#262626] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>{badge.taskRequirement}</span>
                    <span className="font-mono font-bold text-white">
                      {badge.current} / {badge.max}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        badge.unlocked ? "bg-[#84cc16]" : "bg-zinc-700"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
