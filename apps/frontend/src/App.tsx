import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { Dashboard } from "./components/Dashboard";
import { ProfilePage } from "./components/ProfilePage";
import { MatchmakingWaiting } from "./components/MatchmakingWaiting";
import { GameArena } from "./components/GameArena";
import { GameOverModal } from "./components/GameOverModal";
import { NetflixMathBackground } from "./components/NetflixMathBackground";
import { SwordsIcon, CheckIcon, CloseIcon } from "./components/Icons";
import type { UserProfile, Opponent, QuestionData, GameOverStats, OnlineUser } from "./types";
import "./index.css";

const getHost = () => (typeof window !== "undefined" && window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname);
const HTTP_BACKEND_URL = `http://${getHost()}:4000`;
const WS_BACKEND_URL = `ws://${getHost()}:8080`;

type AppView = "LOGIN" | "SIGNUP" | "DASHBOARD" | "PROFILE" | "WAITING" | "PLAYING" | "GAME_OVER";

export function App() {
  const tabId = useRef(`tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`).current;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<AppView>("LOGIN");
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [matchSecondsRemaining, setMatchSecondsRemaining] = useState(60);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{
    type: "CORRECT" | "WRONG" | "TIMEOUT" | null;
    message: string;
    delta: number;
  } | null>(null);
  const [gameOverStats, setGameOverStats] = useState<GameOverStats | null>(null);
  const [incomingDuel, setIncomingDuel] = useState<{ requestId: string; from: Opponent } | null>(null);
  const [outgoingDuel, setOutgoingDuel] = useState<{ targetUserId: string; targetUsername: string } | null>(null);
  const [duelNotice, setDuelNotice] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number;
    userId: string;
    username: string;
    rating: number;
    gamesPlayed: number;
    wins: number;
  }>>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${HTTP_BACKEND_URL}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch {}
  };

  useEffect(() => {
    // Fresh start to login page
    sessionStorage.removeItem("math_duel_session_token");
    try {
      localStorage.clear();
    } catch {}
    setToken(null);
    setUser(null);
    setView("LOGIN");
    fetchLeaderboard();
  }, []);

  const fetchUserProfile = async (authToken: string, preserveView = false) => {
    try {
      const res = await fetch(`${HTTP_BACKEND_URL}/api/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (!preserveView) {
          setView("DASHBOARD");
        }
      } else {
        sessionStorage.removeItem("math_duel_session_token");
        setToken(null);
        setUser(null);
        setView("LOGIN");
      }
    } catch {
      console.warn("Could not reach HTTP backend for profile");
    }
  };

  useEffect(() => {
    const uniqueUserId = user ? user.id : `visitor_${tabId}`;
    const username = user ? user.username : "Visitor";
    const wsUrl = `${WS_BACKEND_URL}?userId=${uniqueUserId}&username=${encodeURIComponent(username)}&rating=${user?.rating ?? 0}&wins=${user?.wins || 0}&gamesPlayed=${user?.gamesPlayed || 0}${token ? `&token=${token}` : ""}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to Math Duel WebSocket (${uniqueUserId})`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "CONNECTED": {
            if (typeof data.onlineCount === "number") {
              setOnlineCount(data.onlineCount);
            }
            if (Array.isArray(data.users)) {
              setOnlineUsers(data.users);
            }
            break;
          }

          case "ONLINE_USERS": {
            if (typeof data.count === "number") {
              setOnlineCount(data.count);
            }
            if (Array.isArray(data.users)) {
              setOnlineUsers(data.users);
            }
            break;
          }

          case "ONLINE_COUNT": {
            if (typeof data.count === "number") {
              setOnlineCount(data.count);
            }
            break;
          }

          case "QUEUE_WAITING": {
            setView("WAITING");
            break;
          }

          case "QUEUE_LEFT": {
            setView("DASHBOARD");
            break;
          }

          case "GAME_STARTED": {
            setIncomingDuel(null);
            setOutgoingDuel(null);
            setOpponent(data.opponent);
            setMatchSecondsRemaining(data.matchDuration || 60);
            setUserScore(0);
            setOpponentScore(0);
            setStreak(0);
            setLastFeedback(null);
            setView("PLAYING");
            break;
          }

          case "DUEL_REQUEST": {
            setIncomingDuel({ requestId: data.requestId, from: data.from });
            break;
          }

          case "DUEL_REQUEST_SENT": {
            setOutgoingDuel({ targetUserId: data.targetUserId, targetUsername: data.targetUsername });
            setDuelNotice(data.message);
            break;
          }

          case "DUEL_ACCEPTED": {
            setOutgoingDuel(null);
            setDuelNotice(`${data.targetUsername} accepted your duel request!`);
            break;
          }

          case "DUEL_DECLINED": {
            setOutgoingDuel(null);
            setDuelNotice(data.message);
            break;
          }

          case "DUEL_EXPIRED": {
            setOutgoingDuel(null);
            setIncomingDuel(null);
            setDuelNotice(data.message);
            break;
          }

          case "DUEL_CANCELLED": {
            setOutgoingDuel(null);
            setIncomingDuel(null);
            setDuelNotice(data.message);
            break;
          }

          case "DUEL_RESPONDED": {
            setIncomingDuel(null);
            break;
          }

          case "ERROR": {
            if (data.message) setDuelNotice(data.message);
            break;
          }

          case "TIME_TICK": {
            setMatchSecondsRemaining(data.secondsRemaining);
            break;
          }

          case "NEW_QUESTION": {
            setQuestion(data.question);
            break;
          }

          case "QUESTION_TIMEOUT": {
            setLastFeedback({
              type: "TIMEOUT",
              message: "TIME'S UP! -5 PTS",
              delta: -5,
            });
            setUserScore(data.newScore);
            setStreak(0);
            break;
          }

          case "ANSWER_RESULT": {
            const isCorrect = data.isCorrect ?? data.correct ?? false;
            const delta = data.scoreDelta ?? data.pointsEarned ?? (isCorrect ? 10 : -3);
            if (isCorrect) {
              setLastFeedback({
                type: "CORRECT",
                message: data.streak >= 3 ? `COMBO +${delta}!` : `+${delta} CORRECT`,
                delta,
              });
            } else {
              setLastFeedback({
                type: "WRONG",
                message: `${delta} WRONG`,
                delta,
              });
            }
            if (typeof data.currentScore === "number") {
              setUserScore(data.currentScore);
            } else if (typeof data.newScore === "number") {
              setUserScore(data.newScore);
            }
            setStreak(data.streak || 0);
            break;
          }

          case "SCORE_UPDATE": {
            if (data.scores && user) {
              if (typeof data.scores[user.id] === "number") {
                setUserScore(data.scores[user.id]);
              }
              if (opponent && typeof data.scores[opponent.id] === "number") {
                setOpponentScore(data.scores[opponent.id]);
              }
            } else if (user && data.userId === user.id) {
              setUserScore(data.score);
            } else if (typeof data.score === "number") {
              setOpponentScore(data.score);
            }
            break;
          }

          case "GAME_OVER": {
            setGameOverStats({
              winnerId: data.winnerId,
              p1: data.p1,
              p2: data.p2,
            });
            setView("GAME_OVER");

            if (token) {
              fetchUserProfile(token, true);
              fetchLeaderboard();
              setTimeout(() => {
                fetchUserProfile(token, true);
                fetchLeaderboard();
              }, 1200);
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [user?.id, token]);

  useEffect(() => {
    if (!duelNotice) return;
    const t = setTimeout(() => setDuelNotice(null), 4000);
    return () => clearTimeout(t);
  }, [duelNotice]);

  useEffect(() => {
    if (user && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "UPDATE_PROFILE",
          username: user.username,
          rating: user.rating,
          wins: user.wins,
          gamesPlayed: user.gamesPlayed,
        })
      );
    }
  }, [user]);

  const handleAccountRegister = async (email: string, username: string, password: string) => {
    try {
      const res = await fetch(`${HTTP_BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || "Registration failed" };
      }
      setToken(data.token);
      setUser(data.user);
      sessionStorage.setItem("math_duel_session_token", data.token);
      setView("DASHBOARD");
      return {};
    } catch {
      return { error: "Could not reach auth server" };
    }
  };

  const handleAccountLogin = async (identifier: string, password: string) => {
    try {
      const res = await fetch(`${HTTP_BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || "Login failed" };
      }
      setToken(data.token);
      setUser(data.user);
      sessionStorage.setItem("math_duel_session_token", data.token);
      setView("DASHBOARD");
      return {};
    } catch {
      return { error: "Could not reach auth server" };
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("math_duel_session_token");
    setToken(null);
    setUser(null);
    setView("LOGIN");
  };

  const handleStartMatchmaking = (vsBot: boolean = false) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("Connecting to duel server... please try in a moment.");
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        type: "JOIN_QUEUE",
        username: user?.username,
        rating: user?.rating,
        wins: user?.wins || 0,
        gamesPlayed: user?.gamesPlayed || 0,
        vsBot,
      })
    );
  };

  const handleChallengeUser = (targetUserId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("Connecting to duel server... please try in a moment.");
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        type: "CHALLENGE_USER",
        targetUserId,
      })
    );
  };

  const handleRespondDuelRequest = (accept: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && incomingDuel) {
      wsRef.current.send(
        JSON.stringify({
          type: "DUEL_RESPONSE",
          accept,
        })
      );
    }
    setIncomingDuel(null);
  };

  const handleCancelOutgoingDuel = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && outgoingDuel) {
      wsRef.current.send(
        JSON.stringify({
          type: "CANCEL_CHALLENGE",
          targetUserId: outgoingDuel.targetUserId,
        })
      );
    }
    setOutgoingDuel(null);
  };

  const handleCancelMatchmaking = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "LEAVE_QUEUE" }));
    }
    setView("DASHBOARD");
  };

  const handleSubmitAnswer = (questionId: string, answer: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "SUBMIT_ANSWER",
          questionId,
          answer,
        })
      );
    }
  };

  const handleLeaveGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "LEAVE_GAME" }));
    }
    setView("DASHBOARD");
  };

  const handlePlayAgain = () => {
    setView("WAITING");
    handleStartMatchmaking(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col selection:bg-[#84cc16] selection:text-black relative overflow-x-hidden">
      {!user && (view === "LOGIN" || view === "SIGNUP") && <NetflixMathBackground />}

      <div className="relative z-10 flex flex-col min-h-screen">
        {view !== "PLAYING" && (
          <Navbar
            user={user}
            onlineCount={onlineCount}
            currentView={view}
            onNavigate={(target) => setView(target)}
            onLogout={handleLogout}
          />
        )}

        <main className="flex-1 flex flex-col">
          {!user && view === "LOGIN" && (
            <LoginPage
              onLogin={handleAccountLogin}
              onSwitchToSignup={() => setView("SIGNUP")}
            />
          )}

          {!user && view === "SIGNUP" && (
            <SignupPage
              onRegister={handleAccountRegister}
              onSwitchToLogin={() => setView("LOGIN")}
            />
          )}

          {user && view === "DASHBOARD" && (
            <Dashboard
              user={user}
              onlineCount={onlineCount}
              onlineUsers={onlineUsers}
              currentWsUserId={user.id}
              onStartMatchmaking={handleStartMatchmaking}
              onChallengeUser={handleChallengeUser}
              onNavigateToProfile={() => setView("PROFILE")}
              isSearching={false}
              leaderboard={leaderboard}
            />
          )}

          {user && view === "PROFILE" && (
            <ProfilePage
              user={user}
              onNavigateToDashboard={() => setView("DASHBOARD")}
              onLogout={handleLogout}
            />
          )}

          {view === "WAITING" && (
            <MatchmakingWaiting onCancel={handleCancelMatchmaking} />
          )}

          {(view === "PLAYING" || view === "GAME_OVER") && user && opponent && (
            <GameArena
              user={user}
              opponent={opponent}
              question={question}
              matchSecondsRemaining={matchSecondsRemaining}
              userScore={userScore}
              opponentScore={opponentScore}
              streak={streak}
              lastFeedback={lastFeedback}
              onSubmitAnswer={handleSubmitAnswer}
              onLeaveGame={handleLeaveGame}
            />
          )}

          {view === "GAME_OVER" && user && gameOverStats && (
            <GameOverModal
              user={user}
              stats={gameOverStats}
              onPlayAgain={handlePlayAgain}
              onBackToDashboard={() => setView("DASHBOARD")}
            />
          )}

          {user && incomingDuel && view !== "PLAYING" && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-[#121212] border border-[#262626] rounded-2xl p-6 shadow-dark-card flex flex-col gap-4 relative text-white">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-[#84cc16] flex items-center justify-center font-bold text-black text-xl shadow-md">
                    {incomingDuel.from.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <SwordsIcon className="w-4 h-4 text-[#84cc16]" />
                      Duel Request
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      <span className="font-semibold text-white">{incomingDuel.from.username}</span> ({incomingDuel.from.rating} ELO) wants to challenge you to a 1v1 duel.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#262626] flex items-center gap-3">
                  <button
                    onClick={() => handleRespondDuelRequest(true)}
                    className="flex-1 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-black text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-lime-glow"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleRespondDuelRequest(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] text-zinc-200 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 text-center -mt-1">Request expires automatically in a few seconds</p>
              </div>
            </div>
          )}

          {user && outgoingDuel && view === "DASHBOARD" && (
            <div className="fixed bottom-5 right-5 z-40 bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 shadow-dark-card flex items-center gap-3 text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div className="text-xs">
                <div className="font-semibold">Waiting for {outgoingDuel.targetUsername} to respond...</div>
                <button onClick={handleCancelOutgoingDuel} className="text-zinc-400 hover:text-white underline mt-0.5 cursor-pointer">
                  Cancel request
                </button>
              </div>
            </div>
          )}

          {duelNotice && view !== "PLAYING" && (
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#121212] border border-[#84cc16]/40 rounded-xl px-5 py-3 shadow-dark-card text-xs text-white max-w-md text-center">
              {duelNotice}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
