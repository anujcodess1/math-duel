import React, { useState } from "react";

interface SignupPageProps {
  onRegister: (email: string, username: string, password: string) => Promise<{ error?: string }>;
  onSwitchToLogin: () => void;
  onlineUsers?: any[];
  onlineCount?: number;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onRegister,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await onRegister(email, username, password);
    setLoading(false);
    if (res.error) setError(res.error);
  };

  return (
    <div className="min-h-[calc(100vh-75px)] w-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#121212]/95 backdrop-blur-xl border border-[#262626] p-8 sm:p-10 rounded-2xl shadow-dark-card flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="w-12 h-12 rounded-xl bg-[#181818] border border-[#2b2b2b] flex items-center justify-center font-extrabold text-[#84cc16] text-2xl shadow-sm">
            ∆
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Start at 0 ELO and challenge players in 1v1 math battles
            </p>
          </div>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 bg-[#181818] border border-[#2b2b2b] focus:border-[#84cc16] focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username (2+ chars)"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-3 bg-[#181818] border border-[#2b2b2b] focus:border-[#84cc16] focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              placeholder="Password (4+ chars)"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 bg-[#181818] border border-[#2b2b2b] focus:border-[#84cc16] focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-black font-extrabold text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-lime-glow active:scale-[0.99]"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="pt-4 border-t border-[#262626] text-center text-xs">
          <span className="text-zinc-500">Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#84cc16] hover:text-[#a3e635] underline font-bold cursor-pointer transition-colors ml-1"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
