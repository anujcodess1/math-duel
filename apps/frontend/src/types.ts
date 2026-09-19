export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  recentGames?: Array<{
    gameId: string;
    score: number;
    result: "WON" | "LOST" | "DRAW";
    joinedAt: string;
    opponents: Array<{ username: string; score: number; result: string }>;
  }>;
}

export interface Opponent {
  id: string;
  username: string;
  rating: number;
}

export interface OnlineUser {
  id: string;
  username: string;
  rating: number;
  wins: number;
  gamesPlayed: number;
  status: "LOBBY" | "SEARCHING" | "IN_GAME";
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
}

export interface QuestionData {
  id: string;
  text: string;
  options: number[];
  timeLimit: number;
}

export interface GameOverStats {
  winnerId: string | null;
  p1: {
    id: string;
    username: string;
    score: number;
    result: "WON" | "LOST" | "DRAW";
    correct: number;
    wrong: number;
    timeouts: number;
  };
  p2: {
    id: string;
    username: string;
    score: number;
    result: "WON" | "LOST" | "DRAW";
    correct: number;
    wrong: number;
    timeouts: number;
  };
}
