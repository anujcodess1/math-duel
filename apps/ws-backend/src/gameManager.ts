import type { ServerWebSocket } from "bun";
import { generateQuestion, type InternalQuestion } from "./mathGenerator.ts";
import { prisma } from "@repo/db";

export interface UserInfo {
  id: string;
  username: string;
  rating: number;
  wins?: number;
  gamesPlayed?: number;
}

export interface PlayerState {
  ws: ServerWebSocket<any>;
  user: UserInfo;
  score: number;
  streak: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeouts: number;
  currentQuestion: InternalQuestion | null;
  questionTimer: Timer | null;
}

export class GameRoom {
  roomId: string;
  p1: PlayerState;
  p2: PlayerState;
  secondsRemaining: number = 60;
  matchTimer: Timer | null = null;
  startedAt: Date;
  status: "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS";
  private onGameOverCallback: (roomId: string) => void;

  constructor(
    roomId: string,
    p1Ws: ServerWebSocket<any>,
    p1User: UserInfo,
    p2Ws: ServerWebSocket<any>,
    p2User: UserInfo,
    onGameOver: (roomId: string) => void
  ) {
    this.roomId = roomId;
    this.startedAt = new Date();
    this.onGameOverCallback = onGameOver;

    this.p1 = {
      ws: p1Ws,
      user: p1User,
      score: 0,
      streak: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeouts: 0,
      currentQuestion: null,
      questionTimer: null,
    };

    this.p2 = {
      ws: p2Ws,
      user: p2User,
      score: 0,
      streak: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeouts: 0,
      currentQuestion: null,
      questionTimer: null,
    };
  }

  start() {
    this.sendToPlayer(this.p1, {
      type: "GAME_STARTED",
      roomId: this.roomId,
      matchDuration: 60,
      opponent: {
        id: this.p2.user.id,
        username: this.p2.user.username,
        rating: this.p2.user.rating,
      },
    });

    this.sendToPlayer(this.p2, {
      type: "GAME_STARTED",
      roomId: this.roomId,
      matchDuration: 60,
      opponent: {
        id: this.p1.user.id,
        username: this.p1.user.username,
        rating: this.p1.user.rating,
      },
    });

    this.nextQuestionForPlayer(this.p1);
    this.nextQuestionForPlayer(this.p2);

    this.matchTimer = setInterval(() => {
      this.secondsRemaining--;

      this.broadcast({
        type: "TIME_TICK",
        secondsRemaining: this.secondsRemaining,
      });

      if (this.secondsRemaining <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  nextQuestionForPlayer(player: PlayerState) {
    if (this.status !== "IN_PROGRESS") return;

    if (player.questionTimer) {
      clearTimeout(player.questionTimer);
      player.questionTimer = null;
    }

    const q = generateQuestion();
    player.currentQuestion = q;

    this.sendToPlayer(player, {
      type: "NEW_QUESTION",
      question: {
        id: q.id,
        text: q.text,
        options: q.options,
        timeLimit: 5,
      },
    });

    player.questionTimer = setTimeout(() => {
      this.handleQuestionTimeout(player);
    }, 5000);
  }

  handleQuestionTimeout(player: PlayerState) {
    if (this.status !== "IN_PROGRESS") return;

    const penalty = 5;
    player.score = Math.max(0, player.score - penalty);
    player.streak = 0;
    player.timeouts++;

    this.sendToPlayer(player, {
      type: "QUESTION_TIMEOUT",
      message: "Time's up! Question skipped (-5 pts)",
      scoreDelta: -penalty,
      currentScore: player.score,
    });

    this.broadcastScoreUpdate();
    this.nextQuestionForPlayer(player);
  }

  handleAnswer(player: PlayerState, questionId: string, selectedAnswer: number) {
    if (this.status !== "IN_PROGRESS") return;

    if (!player.currentQuestion || player.currentQuestion.id !== questionId) {
      return;
    }

    if (player.questionTimer) {
      clearTimeout(player.questionTimer);
      player.questionTimer = null;
    }

    const isCorrect = selectedAnswer === player.currentQuestion.correctAnswer;
    let scoreDelta = 0;

    if (isCorrect) {
      player.streak++;
      player.correctAnswers++;
      scoreDelta = 10 + (player.streak >= 3 ? 2 : 0);
      player.score += scoreDelta;
    } else {
      player.streak = 0;
      player.wrongAnswers++;
      scoreDelta = -3;
      player.score = Math.max(0, player.score + scoreDelta);
    }

    this.sendToPlayer(player, {
      type: "ANSWER_RESULT",
      isCorrect,
      scoreDelta,
      currentScore: player.score,
      streak: player.streak,
      correctAnswer: player.currentQuestion.correctAnswer,
    });

    this.broadcastScoreUpdate();
    this.nextQuestionForPlayer(player);
  }

  broadcastScoreUpdate() {
    this.broadcast({
      type: "SCORE_UPDATE",
      scores: {
        [this.p1.user.id]: this.p1.score,
        [this.p2.user.id]: this.p2.score,
      },
    });
  }

  handlePlayerDisconnect(disconnectedUserId: string) {
    if (this.status !== "IN_PROGRESS") return;

    const remainingPlayer = disconnectedUserId === this.p1.user.id ? this.p2 : this.p1;
    const disconnectedPlayer = disconnectedUserId === this.p1.user.id ? this.p1 : this.p2;

    this.sendToPlayer(remainingPlayer, {
      type: "OPPONENT_DISCONNECTED",
      message: `${disconnectedPlayer.user.username} disconnected. You win by forfeit!`,
    });

    this.endGame(remainingPlayer.user.id);
  }

  endGame(forcedWinnerId?: string) {
    if (this.status === "COMPLETED") return;
    this.status = "COMPLETED";

    if (this.matchTimer) clearInterval(this.matchTimer);
    if (this.p1.questionTimer) clearTimeout(this.p1.questionTimer);
    if (this.p2.questionTimer) clearTimeout(this.p2.questionTimer);

    let winnerId: string | null = null;
    let p1Result: "WON" | "LOST" | "DRAW" = "DRAW";
    let p2Result: "WON" | "LOST" | "DRAW" = "DRAW";

    if (forcedWinnerId) {
      winnerId = forcedWinnerId;
      p1Result = forcedWinnerId === this.p1.user.id ? "WON" : "LOST";
      p2Result = forcedWinnerId === this.p2.user.id ? "WON" : "LOST";
    } else {
      if (this.p1.score > this.p2.score) {
        winnerId = this.p1.user.id;
        p1Result = "WON";
        p2Result = "LOST";
      } else if (this.p2.score > this.p1.score) {
        winnerId = this.p2.user.id;
        p1Result = "LOST";
        p2Result = "WON";
      } else {
        winnerId = null;
        p1Result = "DRAW";
        p2Result = "DRAW";
      }
    }

    const payload = {
      type: "GAME_OVER",
      winnerId,
      p1: {
        id: this.p1.user.id,
        username: this.p1.user.username,
        score: this.p1.score,
        result: p1Result,
        correct: this.p1.correctAnswers,
        wrong: this.p1.wrongAnswers,
        timeouts: this.p1.timeouts,
      },
      p2: {
        id: this.p2.user.id,
        username: this.p2.user.username,
        score: this.p2.score,
        result: p2Result,
        correct: this.p2.correctAnswers,
        wrong: this.p2.wrongAnswers,
        timeouts: this.p2.timeouts,
      },
    };

    this.broadcast(payload);

    this.persistGameResults(p1Result, p2Result).catch((err) => {
      console.error("Failed to persist game results to database:", err);
    });

    this.onGameOverCallback(this.roomId);
  }

  private async persistGameResults(p1Result: "WON" | "LOST" | "DRAW", p2Result: "WON" | "LOST" | "DRAW") {
    try {
      const endedAt = new Date();

      await prisma.game.create({
        data: {
          timeLimit: 60,
          status: "COMPLETED",
          startedAt: this.startedAt,
          endedAt,
          members: {
            create: [
              {
                userId: this.p1.user.id,
                score: this.p1.score,
                result: p1Result,
              },
              {
                userId: this.p2.user.id,
                score: this.p2.score,
                result: p2Result,
              },
            ],
          },
        },
      });

      const p1RatingDelta = p1Result === "WON" ? 25 : p1Result === "LOST" ? -15 : 5;
      const p2RatingDelta = p2Result === "WON" ? 25 : p2Result === "LOST" ? -15 : 5;

      await prisma.userRating.upsert({
        where: { userId: this.p1.user.id },
        update: {
          rating: { increment: p1RatingDelta },
          gamesPlayed: { increment: 1 },
          wins: { increment: p1Result === "WON" ? 1 : 0 },
          losses: { increment: p1Result === "LOST" ? 1 : 0 },
          draws: { increment: p1Result === "DRAW" ? 1 : 0 },
        },
        create: {
          userId: this.p1.user.id,
          rating: Math.max(0, 0 + p1RatingDelta),
          gamesPlayed: 1,
          wins: p1Result === "WON" ? 1 : 0,
          losses: p1Result === "LOST" ? 1 : 0,
          draws: p1Result === "DRAW" ? 1 : 0,
        },
      });

      await prisma.userRating.upsert({
        where: { userId: this.p2.user.id },
        update: {
          rating: { increment: p2RatingDelta },
          gamesPlayed: { increment: 1 },
          wins: { increment: p2Result === "WON" ? 1 : 0 },
          losses: { increment: p2Result === "LOST" ? 1 : 0 },
          draws: { increment: p2Result === "DRAW" ? 1 : 0 },
        },
        create: {
          userId: this.p2.user.id,
          rating: Math.max(0, 0 + p2RatingDelta),
          gamesPlayed: 1,
          wins: p2Result === "WON" ? 1 : 0,
          losses: p2Result === "LOST" ? 1 : 0,
          draws: p2Result === "DRAW" ? 1 : 0,
        },
      });

      console.log(`✅ Game ${this.roomId} persisted to DB with ratings updated.`);
    } catch (e) {
      console.warn(`[Game ${this.roomId}] DB write bypassed (offline/in-memory mode):`, (e as Error).message);
    }
  }

  sendToPlayer(player: PlayerState, data: object) {
    try {
      player.ws.send(JSON.stringify(data));
    } catch {}
  }

  broadcast(data: object) {
    this.sendToPlayer(this.p1, data);
    this.sendToPlayer(this.p2, data);
  }
}

export interface PendingChallenge {
  requestId: string;
  challengerWs: ServerWebSocket<any>;
  challengerUser: UserInfo;
  targetWs: ServerWebSocket<any>;
  targetUserId: string;
  expiresTimer: Timer;
}

export class GameManager {
  private queue: Array<{ ws: ServerWebSocket<any>; user: UserInfo }> = [];
  private activeRooms: Map<string, GameRoom> = new Map();
  private userToRoom: Map<string, string> = new Map();
  private pendingChallenges = new Map<string, PendingChallenge>();

  private onStateChangeCallback?: () => void;

  setOnStateChange(cb: () => void) {
    this.onStateChangeCallback = cb;
  }

  notifyStateChange() {
    if (this.onStateChangeCallback) {
      try {
        this.onStateChangeCallback();
      } catch (err) {
        console.error("Error in onStateChangeCallback:", err);
      }
    }
  }

  getUserStatus(userId: string): "LOBBY" | "SEARCHING" | "IN_GAME" {
    if (this.userToRoom.has(userId)) {
      const roomId = this.userToRoom.get(userId)!;
      const room = this.activeRooms.get(roomId);
      if (room && room.status === "IN_PROGRESS") {
        return "IN_GAME";
      }
    }
    if (this.queue.some((entry) => entry.user.id === userId)) {
      return "SEARCHING";
    }
    return "LOBBY";
  }

  challengeUser(
    challengerWs: ServerWebSocket<any>,
    challengerUser: UserInfo,
    targetUserId: string,
    clients: Set<ServerWebSocket<any>>
  ) {
    if (challengerUser.id === targetUserId) {
      challengerWs.send(JSON.stringify({ type: "ERROR", message: "Cannot challenge yourself" }));
      return;
    }

    if (this.getUserStatus(challengerUser.id) === "IN_GAME") {
      challengerWs.send(JSON.stringify({ type: "ERROR", message: "You are already in a match" }));
      return;
    }

    let targetWs: ServerWebSocket<any> | null = null;
    let targetUser: UserInfo | null = null;
    for (const client of clients) {
      if (client.data?.user?.id === targetUserId) {
        targetWs = client;
        targetUser = client.data.user;
        break;
      }
    }

    if (!targetWs || !targetUser) {
      challengerWs.send(JSON.stringify({ type: "ERROR", message: "Player is no longer online" }));
      return;
    }

    if (this.getUserStatus(targetUserId) === "IN_GAME") {
      challengerWs.send(JSON.stringify({ type: "ERROR", message: "Player is currently in another match" }));
      return;
    }

    if (this.pendingChallenges.has(targetUserId)) {
      challengerWs.send(JSON.stringify({ type: "ERROR", message: "Player already has a pending duel request" }));
      return;
    }

    this.leaveQueue(challengerUser.id);
    this.leaveQueue(targetUserId);

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const expiresTimer = setTimeout(() => {
      const pending = this.pendingChallenges.get(targetUserId);
      if (!pending || pending.requestId !== requestId) return;
      this.pendingChallenges.delete(targetUserId);
      try {
        pending.challengerWs.send(
          JSON.stringify({ type: "DUEL_EXPIRED", targetUserId, message: `Duel request expired — ${targetUser.username} didn't respond in time.` })
        );
        pending.targetWs.send(JSON.stringify({ type: "DUEL_EXPIRED", message: "Duel request expired." }));
      } catch {}
      console.log(`⌛ Duel request from ${challengerUser.username} to ${targetUser.username} expired.`);
    }, 15000);

    this.pendingChallenges.set(targetUserId, {
      requestId,
      challengerWs,
      challengerUser,
      targetWs,
      targetUserId,
      expiresTimer,
    });

    targetWs.send(
      JSON.stringify({
        type: "DUEL_REQUEST",
        requestId,
        from: {
          id: challengerUser.id,
          username: challengerUser.username,
          rating: challengerUser.rating,
        },
      })
    );

    challengerWs.send(
      JSON.stringify({
        type: "DUEL_REQUEST_SENT",
        targetUserId,
        targetUsername: targetUser.username,
        message: `Duel request sent to ${targetUser.username}. Waiting for response...`,
      })
    );

    console.log(`📨 DUEL REQUEST SENT: ${challengerUser.username} → ${targetUser.username}`);
    this.notifyStateChange();
  }

  respondToChallenge(userId: string, accept: boolean) {
    const pending = this.pendingChallenges.get(userId);
    if (!pending) {
      return;
    }
    this.pendingChallenges.delete(userId);
    clearTimeout(pending.expiresTimer);

    const { challengerWs, challengerUser, targetWs, targetUserId } = pending;
    const targetUser = targetWs.data?.user ?? challengerUser;

    if (!accept) {
      try {
        challengerWs.send(
          JSON.stringify({ type: "DUEL_DECLINED", targetUserId, message: `${targetUser.username} declined your duel request.` })
        );
        targetWs.send(JSON.stringify({ type: "DUEL_RESPONDED", accepted: false }));
      } catch {}
      console.log(`❌ ${targetUser.username} declined the duel request from ${challengerUser.username}.`);
      return;
    }

    if (this.getUserStatus(challengerUser.id) === "IN_GAME" || this.getUserStatus(targetUserId) === "IN_GAME") {
      try {
        targetWs.send(JSON.stringify({ type: "ERROR", message: "Player is no longer available" }));
      } catch {}
      return;
    }

    const roomId = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const gameRoom = new GameRoom(
      roomId,
      challengerWs,
      challengerUser,
      targetWs,
      targetUser,
      (finishedRoomId) => this.cleanupRoom(finishedRoomId)
    );

    this.activeRooms.set(roomId, gameRoom);
    this.userToRoom.set(challengerUser.id, roomId);
    this.userToRoom.set(targetUser.id, roomId);

    try {
      challengerWs.send(JSON.stringify({ type: "DUEL_ACCEPTED", targetUserId, targetUsername: targetUser.username }));
    } catch {}

    console.log(`⚔️ DUEL ACCEPTED: ${challengerUser.username} vs ${targetUser.username} (Room: ${roomId})`);
    gameRoom.start();
    this.notifyStateChange();
  }

  cancelChallenge(challengerUserId: string, targetUserId: string) {
    const pending = this.pendingChallenges.get(targetUserId);
    if (!pending || pending.challengerUser.id !== challengerUserId) return;
    this.pendingChallenges.delete(targetUserId);
    clearTimeout(pending.expiresTimer);
    try {
      pending.targetWs.send(JSON.stringify({ type: "DUEL_CANCELLED", message: "The duel request was cancelled." }));
    } catch {}
  }

  private clearChallengesForUser(userId: string) {
    const pending = this.pendingChallenges.get(userId);
    if (pending) {
      this.pendingChallenges.delete(userId);
      clearTimeout(pending.expiresTimer);
      try {
        pending.challengerWs.send(
          JSON.stringify({ type: "DUEL_CANCELLED", targetUserId: userId, message: "Player disconnected before responding." })
        );
      } catch {}
    }
    for (const [targetId, p] of Array.from(this.pendingChallenges.entries())) {
      if (p.challengerUser.id === userId) {
        this.pendingChallenges.delete(targetId);
        clearTimeout(p.expiresTimer);
        try {
          p.targetWs.send(JSON.stringify({ type: "DUEL_CANCELLED", message: "The duel request was cancelled." }));
        } catch {}
      }
    }
  }

  joinQueue(ws: ServerWebSocket<any>, user: UserInfo, vsBot: boolean = false) {
    this.leaveQueue(user.id);

    if (this.userToRoom.has(user.id)) {
      const existingRoomId = this.userToRoom.get(user.id)!;
      const room = this.activeRooms.get(existingRoomId);
      if (room && room.status === "IN_PROGRESS") {
        ws.send(JSON.stringify({ type: "ALREADY_IN_GAME", roomId: existingRoomId }));
        return;
      }
    }

    if (vsBot) {
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const botUser: UserInfo = {
        id: botId,
        username: "CyberDuelist_Bot 🤖",
        rating: Math.floor(Math.random() * 200) + 1150,
        wins: 42,
        gamesPlayed: 50,
      };

      let activeRoomRef: GameRoom | null = null;

      const botWs = {
        send: (rawMsg: string) => {
          try {
            const parsed = JSON.parse(rawMsg);
            if (parsed.type === "NEW_QUESTION" && activeRoomRef && activeRoomRef.status === "IN_PROGRESS") {
              const q = parsed.question;
              const thinkTimeMs = Math.floor(Math.random() * 2200) + 1800;
              setTimeout(() => {
                if (activeRoomRef && activeRoomRef.status === "IN_PROGRESS") {
                  const curQ = activeRoomRef.p2.currentQuestion;
                  if (curQ && curQ.id === q.id) {
                    const isCorrect = Math.random() < 0.82;
                    const chosenAnswer = isCorrect
                      ? curQ.correctAnswer
                      : q.options.find((o: number) => o !== curQ.correctAnswer) ?? q.options[0];
                    activeRoomRef.handleAnswer(activeRoomRef.p2, q.id, chosenAnswer);
                  }
                }
              }, thinkTimeMs);
            }
          } catch {}
        },
      } as unknown as ServerWebSocket<any>;

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const gameRoom = new GameRoom(
        roomId,
        ws,
        user,
        botWs,
        botUser,
        (finishedRoomId) => this.cleanupRoom(finishedRoomId)
      );

      activeRoomRef = gameRoom;
      this.activeRooms.set(roomId, gameRoom);
      this.userToRoom.set(user.id, roomId);
      this.userToRoom.set(botId, roomId);

      console.log(`🎮 Match created vs AI Bot: ${user.username} vs ${botUser.username} (Room: ${roomId})`);
      gameRoom.start();
      this.notifyStateChange();
      return;
    }

    if (this.queue.length > 0) {
      const opponent = this.queue.shift()!;
      if (opponent.ws === ws) {
        this.queue.push({ ws, user });
        ws.send(JSON.stringify({ type: "QUEUE_WAITING", message: "Searching for opponent..." }));
        this.notifyStateChange();
        return;
      }

      let player2User = user;
      if (opponent.user.id === user.id) {
        player2User = {
          ...user,
          id: `${user.id}_tab2_${Math.random().toString(36).substring(2, 6)}`,
          username: `${user.username} (Tab 2)`,
        };
      }

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const gameRoom = new GameRoom(
        roomId,
        opponent.ws,
        opponent.user,
        ws,
        player2User,
        (finishedRoomId) => this.cleanupRoom(finishedRoomId)
      );

      this.activeRooms.set(roomId, gameRoom);
      this.userToRoom.set(opponent.user.id, roomId);
      this.userToRoom.set(player2User.id, roomId);

      console.log(`🎮 Match created: ${opponent.user.username} vs ${player2User.username} (Room: ${roomId})`);
      gameRoom.start();
      this.notifyStateChange();
    } else {
      this.queue.push({ ws, user });
      ws.send(
        JSON.stringify({
          type: "QUEUE_WAITING",
          message: "Searching for an opponent... waiting in queue.",
        })
      );
      console.log(`⏳ ${user.username} joined matchmaking queue. (Queue size: 1)`);
      this.notifyStateChange();
    }
  }

  leaveQueue(userId: string) {
    const initialLen = this.queue.length;
    this.queue = this.queue.filter((entry) => entry.user.id !== userId);
    if (this.queue.length !== initialLen) {
      console.log(`User ${userId} left matchmaking queue.`);
      this.notifyStateChange();
    }
  }

  handleAnswer(userId: string, questionId: string, answer: number) {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return;

    const room = this.activeRooms.get(roomId);
    if (!room) return;

    const player = room.p1.user.id === userId ? room.p1 : room.p2;
    room.handleAnswer(player, questionId, answer);
  }

  handleLeaveGame(userId: string) {
    this.handleDisconnect(userId);
  }

  handleDisconnect(userId: string) {
    this.leaveQueue(userId);
    this.clearChallengesForUser(userId);

    const roomId = this.userToRoom.get(userId);
    if (roomId) {
      const room = this.activeRooms.get(roomId);
      if (room) {
        room.handlePlayerDisconnect(userId);
      }
      this.userToRoom.delete(userId);
    }
    this.notifyStateChange();
  }

  private cleanupRoom(roomId: string) {
    const room = this.activeRooms.get(roomId);
    if (room) {
      this.userToRoom.delete(room.p1.user.id);
      this.userToRoom.delete(room.p2.user.id);
      this.activeRooms.delete(roomId);
      console.log(`🧹 Cleaned up room ${roomId}`);
      this.notifyStateChange();
    }
  }
}

export const gameManager = new GameManager();
