import "dotenv/config";
import type { ServerWebSocket } from "bun";
import jwt from "jsonwebtoken";
import { gameManager, type UserInfo } from "./src/gameManager.ts";

const PORT = parseInt(process.env.WS_PORT || process.env.PORT || "8080", 10);
const JWT_SECRET = process.env.JWT_SECRET || "math-duel-super-secret-jwt-key";

export interface OnlineUserDto {
  id: string;
  username: string;
  rating: number;
  wins: number;
  gamesPlayed: number;
  status: "LOBBY" | "SEARCHING" | "IN_GAME";
}

interface WsData {
  user: UserInfo;
}

const connectedClients = new Set<ServerWebSocket<WsData>>();

function getOnlineUsersList(): OnlineUserDto[] {
  const usersMap = new Map<string, OnlineUserDto>();
  for (const client of connectedClients) {
    if (!client.data?.user) continue;
    const u = client.data.user;
    if (u.username.toLowerCase().startsWith("visitor") || u.id.startsWith("visitor_")) continue;
    const status = gameManager.getUserStatus(u.id);
    usersMap.set(u.id, {
      id: u.id,
      username: u.username,
      rating: u.rating ?? 0,
      wins: u.wins || 0,
      gamesPlayed: u.gamesPlayed || 0,
      status,
    });
  }
  return Array.from(usersMap.values());
}

function broadcastOnlineUsers() {
  const users = getOnlineUsersList();
  const payload = JSON.stringify({
    type: "ONLINE_USERS",
    count: users.length,
    users,
  });
  for (const client of connectedClients) {
    try {
      client.send(payload);
    } catch {}
  }
}

gameManager.setOnStateChange(() => {
  broadcastOnlineUsers();
});

const server = Bun.serve<WsData>({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    const token = url.searchParams.get("token");
    const queryRating = parseInt(url.searchParams.get("rating") || "0", 10);
    const queryWins = parseInt(url.searchParams.get("wins") || "0", 10);
    const queryGamesPlayed = parseInt(url.searchParams.get("gamesPlayed") || "0", 10);

    let user: UserInfo | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string;
          username: string;
        };
        user = {
          id: decoded.id,
          username: decoded.username,
          rating: !isNaN(queryRating) ? queryRating : 0,
          wins: !isNaN(queryWins) ? queryWins : 0,
          gamesPlayed: !isNaN(queryGamesPlayed) ? queryGamesPlayed : 0,
        };
      } catch {
        console.warn("Invalid JWT token on WS connection");
      }
    }

    if (!user) {
      const guestId = url.searchParams.get("userId") || `guest_${Math.random().toString(36).substring(2, 8)}`;
      const guestUsername = url.searchParams.get("username") || `Guest_${Math.floor(100 + Math.random() * 900)}`;

      user = {
        id: guestId,
        username: guestUsername,
        rating: !isNaN(queryRating) ? queryRating : 0,
        wins: !isNaN(queryWins) ? queryWins : 0,
        gamesPlayed: !isNaN(queryGamesPlayed) ? queryGamesPlayed : 0,
      };
    }

    const upgraded = server.upgrade(req, {
      data: { user },
    });

    if (upgraded) {
      return undefined;
    }

    return new Response("Math Duel WebSocket Server. Connect via ws:// or wss://", { status: 400 });
  },

  websocket: {
    open(ws) {
      connectedClients.add(ws);
      console.log(`🔌 WS Connected: ${ws.data.user.username} (${ws.data.user.id}) - Total Online: ${connectedClients.size}`);

      ws.send(
        JSON.stringify({
          type: "CONNECTED",
          user: ws.data.user,
          onlineCount: connectedClients.size,
          users: getOnlineUsersList(),
        })
      );

      broadcastOnlineUsers();
    },

    message(ws, message) {
      try {
        const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
        const data = JSON.parse(raw);

        switch (data.type) {
          case "JOIN_QUEUE": {
            if (data.rating) ws.data.user.rating = data.rating;
            if (data.username) ws.data.user.username = data.username;
            if (typeof data.wins === "number") ws.data.user.wins = data.wins;
            if (typeof data.gamesPlayed === "number") ws.data.user.gamesPlayed = data.gamesPlayed;
            gameManager.joinQueue(ws, ws.data.user, !!data.vsBot);
            break;
          }

          case "CHALLENGE_USER": {
            if (data.targetUserId) {
              gameManager.challengeUser(ws, ws.data.user, data.targetUserId, connectedClients);
            }
            break;
          }

          case "DUEL_RESPONSE": {
            gameManager.respondToChallenge(ws.data.user.id, !!data.accept);
            break;
          }

          case "CANCEL_CHALLENGE": {
            if (data.targetUserId) {
              gameManager.cancelChallenge(ws.data.user.id, data.targetUserId);
            }
            break;
          }

          case "UPDATE_PROFILE": {
            if (data.username) ws.data.user.username = data.username;
            if (typeof data.rating === "number") ws.data.user.rating = data.rating;
            if (typeof data.wins === "number") ws.data.user.wins = data.wins;
            if (typeof data.gamesPlayed === "number") ws.data.user.gamesPlayed = data.gamesPlayed;
            broadcastOnlineUsers();
            break;
          }

          case "LEAVE_QUEUE": {
            gameManager.leaveQueue(ws.data.user.id);
            ws.send(JSON.stringify({ type: "QUEUE_LEFT" }));
            break;
          }

          case "SUBMIT_ANSWER": {
            if (typeof data.questionId === "string" && typeof data.answer === "number") {
              gameManager.handleAnswer(ws.data.user.id, data.questionId, data.answer);
            }
            break;
          }

          case "LEAVE_GAME": {
            gameManager.handleLeaveGame(ws.data.user.id);
            break;
          }

          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    },

    close(ws) {
      connectedClients.delete(ws);
      console.log(`🚪 WS Disconnected: ${ws.data.user.username} (${ws.data.user.id}) - Total Online: ${connectedClients.size}`);
      gameManager.handleDisconnect(ws.data.user.id);
      broadcastOnlineUsers();
    },
  },
});

console.log(`⚡ WebSocket backend running at ws://localhost:${server.port}`);