import React from "react";
import { SwordsIcon } from "./Icons";

interface MatchmakingWaitingProps {
  onCancel: () => void;
}

export const MatchmakingWaiting: React.FC<MatchmakingWaitingProps> = ({ onCancel }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#121212] border border-[#262626] shadow-dark-sm flex items-center justify-center mb-6 ring-2 ring-[#84cc16]/30">
        <SwordsIcon className="w-9 h-9 text-[#84cc16]" />
      </div>

      <h2 className="text-xl font-bold text-white tracking-tight mb-2">
        Searching For Opponent...
      </h2>
      <p className="text-xs text-zinc-400 max-w-sm mb-6">
        Waiting for an online player to enter the matchmaking queue.
      </p>

      <button
        onClick={onCancel}
        className="px-6 py-2.5 rounded-xl border border-[#2b2b2b] bg-[#141414] hover:bg-[#1f1f1f] hover:border-[#84cc16] text-xs font-semibold text-zinc-300 hover:text-white transition-all uppercase tracking-wider cursor-pointer shadow-sm active:scale-[0.99]"
      >
        Cancel Search
      </button>
    </div>
  );
};
