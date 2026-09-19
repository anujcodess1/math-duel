import React from "react";
import type { UserProfile } from "../types";

interface NavbarProps {
  user: UserProfile | null;
  onlineCount: number;
  currentView: string;
  onNavigate: (view: "DASHBOARD" | "PROFILE" | "LOGIN" | "SIGNUP") => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onlineCount,
  currentView,
  onNavigate,
  onLogout,
}) => {
  return (
    <header className="w-full border-b border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 shadow-dark-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate(user ? "DASHBOARD" : "LOGIN")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#84cc16] flex items-center justify-center font-extrabold text-black text-base shadow-sm">
              ∑
            </div>
            <div className="text-left">
              <span className="font-bold text-sm text-white block tracking-tight">
                Math Duel
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#262626] text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse" />
            <span className="text-zinc-300 font-medium">{onlineCount} Online</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <nav className="flex items-center gap-1 bg-[#141414] border border-[#262626] p-1 rounded-xl">
                <button
                  onClick={() => onNavigate("DASHBOARD")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentView === "DASHBOARD"
                      ? "bg-[#84cc16] text-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate("PROFILE")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentView === "PROFILE"
                      ? "bg-[#84cc16] text-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Profile
                </button>
              </nav>

              <button
                onClick={() => onNavigate("PROFILE")}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#84cc16] transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-[#84cc16] flex items-center justify-center font-extrabold text-black text-xs">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-white">
                  {user.username}
                </span>
                <span className="px-2 py-0.5 rounded bg-black text-[#84cc16] text-[11px] font-bold border border-[#84cc16]/40">
                  {user.rating} ELO
                </span>
              </button>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-rose-950/40 border border-[#262626] hover:border-rose-800 text-zinc-400 hover:text-rose-400 text-xs font-medium transition-colors cursor-pointer"
                title="Log Out"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => onNavigate("LOGIN")}
                className={`px-3.5 py-1.5 rounded-xl border transition-colors cursor-pointer font-semibold ${
                  currentView === "LOGIN"
                    ? "bg-[#84cc16] border-[#84cc16] text-black shadow-sm"
                    : "bg-[#141414] border-[#262626] text-zinc-300 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("SIGNUP")}
                className={`px-3.5 py-1.5 rounded-xl border transition-colors cursor-pointer font-bold ${
                  currentView === "SIGNUP"
                    ? "bg-[#84cc16] border-[#84cc16] text-black shadow-sm"
                    : "bg-[#84cc16] hover:bg-[#65a30d] border-[#84cc16] text-black shadow-sm"
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
