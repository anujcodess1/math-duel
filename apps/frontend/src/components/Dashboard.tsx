import React, { useRef, useState } from "react";
import type { UserProfile, OnlineUser } from "../types";
import {
  SwordsIcon,
  RobotIcon,
  TrophyIcon,
  MedalIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "./Icons";

interface DashboardProps {
  user: UserProfile;
  onlineUsers: OnlineUser[];
  onlineCount?: number;
  currentWsUserId: string;
  isSearching: boolean;
  onStartMatchmaking: (vsBot?: boolean) => void;
  onChallengeUser: (targetUserId: string) => void;
  onNavigateToProfile: () => void;
  leaderboard?: Array<{
    rank: number;
    userId: string;
    username: string;
    rating: number;
    gamesPlayed: number;
    wins: number;
  }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onlineUsers,
  currentWsUserId,
  isSearching,
  onStartMatchmaking,
  onChallengeUser,
  onNavigateToProfile,
  leaderboard = [],
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<OnlineUser | null>(null);

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const getRankInfo = (rating: number) => {
    if (rating >= 600) {
      return { tier: "GRANDMASTER", color: "text-amber-400 border-amber-600/60 bg-amber-950/40" };
    }
    if (rating >= 350) {
      return { tier: "DIAMOND SAGE", color: "text-[#84cc16] border-[#84cc16]/50 bg-[#84cc16]/10" };
    }
    if (rating >= 150) {
      return { tier: "GOLD TACTICIAN", color: "text-amber-300 border-amber-800 bg-amber-950/30" };
    }
    if (rating >= 50) {
      return { tier: "SILVER DUELIST", color: "text-zinc-200 border-zinc-700 bg-zinc-900" };
    }
    return { tier: "RECRUIT", color: "text-zinc-400 border-zinc-800 bg-zinc-950" };
  };

  const userRank = getRankInfo(user.rating);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-7 flex flex-col gap-6 min-h-[calc(100vh-75px)] justify-between">
      <div className="w-full bg-[#121212] border border-[#262626] rounded-2xl p-5 shadow-dark-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#84cc16] animate-pulse" />
            <h2 className="text-sm font-semibold tracking-wide text-white">
              Active Players Online
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1a1a1a] border border-[#2b2b2b] text-xs text-zinc-300 font-medium">
              {onlineUsers.length} in lobby
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleScrollLeft}
              className="w-7 h-7 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleScrollRight}
              className="w-7 h-7 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Scroll right"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex items-center gap-5 overflow-x-auto scrollbar-none py-1.5 px-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {onlineUsers.map((player) => {
            const isMe = player.id === currentWsUserId || player.username === user.username;

            return (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer relative"
              >
                <div className="relative">
                  <div
                    className={`w-13 h-13 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isMe
                        ? "bg-[#84cc16] text-black shadow-lime-glow ring-2 ring-[#84cc16]/50"
                        : "bg-[#1c1c1c] border border-[#2e2e2e] text-zinc-200 group-hover:border-[#84cc16] group-hover:text-[#84cc16]"
                    }`}
                  >
                    {player.username.substring(0, 2).toUpperCase()}
                  </div>

                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#121212] ${
                      player.status === "IN_GAME"
                        ? "bg-rose-500"
                        : player.status === "SEARCHING"
                        ? "bg-amber-500"
                        : "bg-[#84cc16]"
                    }`}
                  />
                </div>

                <span className="text-xs font-medium text-zinc-300 max-w-[76px] truncate block text-center">
                  {player.username}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                    player.status === "IN_GAME"
                      ? "text-rose-400 bg-rose-950/60 border-rose-900"
                      : player.status === "SEARCHING"
                      ? "text-amber-400 bg-amber-950/60 border-amber-900"
                      : "text-[#84cc16] bg-emerald-950/50 border-[#84cc16]/40"
                  }`}
                >
                  {player.status === "IN_GAME" ? "In Duel" : player.status === "SEARCHING" ? "Queue" : "Online"}
                </span>
              </button>
            );
          })}

          {onlineUsers.length === 0 && (
            <div className="py-3 px-2 text-zinc-500 text-xs">
              Waiting for duelists to connect...
            </div>
          )}

          {onlineUsers.length > 5 && (
            <button
              onClick={handleScrollRight}
              className="w-9 h-9 rounded-full bg-[#181818] hover:bg-[#242424] border border-[#2b2b2b] flex items-center justify-center text-white shrink-0 cursor-pointer"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121212] border border-[#262626] rounded-2xl p-6 shadow-dark-card flex flex-col gap-4 relative text-white">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <CloseIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-[#84cc16] flex items-center justify-center font-bold text-black text-xl shadow-md">
                {selectedPlayer.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedPlayer.username}</h3>
                  {selectedPlayer.id === currentWsUserId && (
                    <span className="px-1.5 py-0.5 bg-[#84cc16]/20 text-[#84cc16] text-[10px] font-bold rounded border border-[#84cc16]/40">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">{selectedPlayer.rating} ELO Rating</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {selectedPlayer.wins} Wins · {selectedPlayer.gamesPlayed} Battles
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Status:{" "}
                <strong className={selectedPlayer.status === "IN_GAME" ? "text-rose-400" : selectedPlayer.status === "SEARCHING" ? "text-amber-400" : "text-[#84cc16]"}>
                  {selectedPlayer.status === "IN_GAME" ? "IN DUEL" : selectedPlayer.status === "SEARCHING" ? "IN QUEUE" : "ONLINE"}
                </strong>
              </span>

              {selectedPlayer.id !== currentWsUserId && (
                <button
                  onClick={() => {
                    onChallengeUser(selectedPlayer.id);
                    setSelectedPlayer(null);
                  }}
                  disabled={selectedPlayer.status === "IN_GAME"}
                  className="px-4 py-2 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-black text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-30 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <SwordsIcon className="w-3.5 h-3.5" />
                  <span>Challenge</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        <div className="lg:col-span-8 flex flex-col justify-center items-center">
          <div className="w-full max-w-xl bg-[#121212] border border-[#262626] rounded-2xl p-8 sm:p-10 shadow-dark-sm flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-xl bg-[#181818] border border-[#2b2b2b] flex items-center justify-center font-extrabold text-[#84cc16] text-3xl mb-4 shadow-sm">
              ∑
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              1v1 Math Duel Arena
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-md mb-6">
              Synchronized 60-second multiplayer math duel. Solve rapid equations within 5 seconds to build combo streaks and climb the ranks.
            </p>

            <div className="w-full flex flex-col gap-3 max-w-md">
              <button
                onClick={() => onStartMatchmaking(false)}
                disabled={isSearching}
                className="w-full py-4 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 shadow-lime-glow active:scale-[0.99]"
              >
                <SwordsIcon className="w-4 h-4" />
                <span>{isSearching ? "Searching For Opponent..." : "Start 1v1 Ranked Duel"}</span>
              </button>

              <button
                onClick={() => onStartMatchmaking(true)}
                disabled={isSearching}
                className="w-full py-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] text-zinc-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RobotIcon className="w-4 h-4 text-zinc-400" />
                <span>Practice vs AI Bot</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-6 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-[#84cc16]" />
              <span>Matchmaking Ready · 60s Match Clock</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <div className="w-full h-full min-h-[400px] bg-[#121212] border border-[#262626] rounded-2xl p-5 sm:p-6 shadow-dark-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-4 h-4 text-[#84cc16]" />
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    Leaderboard
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#181818] border border-[#2b2b2b] text-xs text-zinc-300 font-medium">
                  Top Duelists
                </span>
              </div>

              <div className="mt-3.5 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {leaderboard.map((entry, index) => {
                  const isUser = entry.userId === user.id || entry.username === user.username;

                  return (
                    <div
                      key={entry.userId || index}
                      className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2.5 ${
                        isUser
                          ? "bg-[#84cc16]/10 border-[#84cc16]/50 shadow-xs"
                          : "bg-[#181818] border-[#262626] hover:border-[#383838]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 flex items-center justify-center shrink-0">
                          {entry.rank === 1 ? (
                            <MedalIcon className="w-4 h-4 text-amber-400" />
                          ) : entry.rank === 2 ? (
                            <MedalIcon className="w-4 h-4 text-slate-300" />
                          ) : entry.rank === 3 ? (
                            <MedalIcon className="w-4 h-4 text-amber-600" />
                          ) : (
                            <span className="text-xs font-bold text-zinc-500 font-mono">#{entry.rank}</span>
                          )}
                        </span>

                        <div className="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {entry.username.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-white truncate block">
                            {entry.username} {isUser && <span className="text-[#84cc16] text-[10px] font-bold">(YOU)</span>}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {entry.wins}W · {entry.gamesPlayed} Battles
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-white">{entry.rating}</div>
                        <div className="text-[9px] text-zinc-500 font-semibold uppercase">ELO</div>
                      </div>
                    </div>
                  );
                })}

                {leaderboard.length === 0 && (
                  <div className="py-10 text-center text-zinc-500 text-xs">
                    No duels recorded yet. Be the first to duel!
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#262626] text-center text-xs text-zinc-500">
              Rankings auto-update after each match
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-between pt-1">
        <button
          onClick={onNavigateToProfile}
          className="group bg-[#121212] border border-[#262626] hover:border-[#84cc16] p-3 px-4 rounded-xl shadow-sm transition-all flex items-center gap-3.5 cursor-pointer"
          title="Open Your Profile"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#84cc16] flex items-center justify-center font-extrabold text-black text-sm shadow-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#84cc16] border-2 border-[#121212]" />
          </div>

          <div className="text-left">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider flex items-center gap-1">
              <span>Your Profile</span>
              <UserIcon className="w-3 h-3 text-[#84cc16]" />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-[#84cc16] transition-colors">
              {user.username}
            </div>
            <div className="text-[11px] text-zinc-400 font-medium">
              {user.rating} ELO · <span className="font-semibold text-white">{userRank.tier}</span>
            </div>
          </div>
        </button>

        <div className="text-right hidden sm:block text-xs text-zinc-500">
          Click any player avatar above to send a duel request
        </div>
      </div>
    </div>
  );
};
