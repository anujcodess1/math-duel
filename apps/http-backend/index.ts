import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "math-duel-super-secret-jwt-key";

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

const localUsers = new Map<string, {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}>();

async function cleanAllDatabase() {
  localUsers.clear();
  try {
    await prisma.questionAnswer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.gameMember.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.friendship.deleteMany({});
    await prisma.userRating.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("🧹 All PostgreSQL tables cleanly wiped.");
  } catch (err) {
    console.log("🧹 Database wiped (local in-memory registry reset). DB connection note:", (err as Error).message);
  }
}

app.post("/api/admin/clean-db", async (_req, res) => {
  await cleanAllDatabase();
  return res.json({ success: true, message: "Database completely cleaned and reset to zero." });
});

cleanAllDatabase();

app.post("/auth/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password required" });
    }

    if (username.length < 2) {
      return res.status(400).json({ error: "Username must be at least 2 characters" });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }

    const hashedPassword = await Bun.password.hash(password);
    let user;
    try {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existing) {
        return res.status(409).json({ error: "Username or email already exists" });
      }

      user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          rating: {
            create: {
              rating: 0,
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              draws: 0,
            },
          },
        },
        include: { rating: true },
      });
    } catch (dbErr) {
      console.warn("DB offline during register, creating local user session:", (dbErr as Error).message);
      for (const u of localUsers.values()) {
        if (u.email === email || u.username.toLowerCase() === username.toLowerCase()) {
          return res.status(409).json({ error: "Username or email already exists" });
        }
      }
      const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      user = {
        id: newId,
        email,
        username,
        rating: { rating: 0, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
      };
      localUsers.set(newId, {
        id: newId,
        email,
        username,
        passwordHash: hashedPassword,
        rating: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        rating: user.rating?.rating ?? 0,
        gamesPlayed: user.rating?.gamesPlayed ?? 0,
        wins: user.rating?.wins ?? 0,
        losses: user.rating?.losses ?? 0,
        draws: user.rating?.draws ?? 0,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Username/email and password required" });
    }

    let user;
    let passwordHash: string | null = null;

    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
        include: { rating: true },
      });
      if (dbUser) {
        user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          rating: dbUser.rating?.rating ?? 0,
          gamesPlayed: dbUser.rating?.gamesPlayed ?? 0,
          wins: dbUser.rating?.wins ?? 0,
          losses: dbUser.rating?.losses ?? 0,
          draws: dbUser.rating?.draws ?? 0,
        };
        passwordHash = dbUser.password;
      }
    } catch (dbErr) {
      console.warn("DB offline during login, checking local user registry");
    }

    if (!user) {
      for (const lu of localUsers.values()) {
        if (lu.email === identifier || lu.username.toLowerCase() === identifier.toLowerCase()) {
          user = {
            id: lu.id,
            username: lu.username,
            email: lu.email,
            rating: lu.rating,
            gamesPlayed: lu.gamesPlayed,
            wins: lu.wins,
            losses: lu.losses,
            draws: lu.draws,
          };
          passwordHash = lu.passwordHash;
          break;
        }
      }
    }

    if (!user || !passwordHash) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const valid = await Bun.password.verify(password, passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    (req as unknown as { user: typeof decoded }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/api/me", authMiddleware, async (req, res) => {
  const authUser = (req as unknown as { user: { id: string; email: string; username: string } }).user;
  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        rating: true,
        gameMemberships: {
          take: 10,
          orderBy: { joinedAt: "desc" },
          include: {
            game: {
              include: {
                members: {
                  include: { user: { select: { id: true, username: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.json({
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        rating: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        recentGames: [],
      });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      rating: user.rating?.rating ?? 0,
      gamesPlayed: user.rating?.gamesPlayed ?? 0,
      wins: user.rating?.wins ?? 0,
      losses: user.rating?.losses ?? 0,
      draws: user.rating?.draws ?? 0,
      recentGames: user.gameMemberships.map((m) => ({
        gameId: m.gameId,
        score: m.score,
        result: m.result,
        joinedAt: m.joinedAt,
        opponents: m.game.members
          .filter((gm) => gm.userId !== user.id)
          .map((gm) => ({ username: gm.user.username, score: gm.score, result: gm.result })),
      })),
    });
  } catch (error) {
    return res.json({
      id: authUser.id,
      username: authUser.username,
      email: authUser.email,
      rating: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      recentGames: [],
    });
  }
});

app.get("/api/leaderboard", async (_req, res) => {
  try {
    const topRatings = await prisma.userRating.findMany({
      take: 20,
      orderBy: { rating: "desc" },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    if (topRatings && topRatings.length > 0) {
      return res.json(
        topRatings.map((r, index) => ({
          rank: index + 1,
          userId: r.userId,
          username: r.user.username,
          rating: r.rating,
          gamesPlayed: r.gamesPlayed,
          wins: r.wins,
          losses: r.losses,
        }))
      );
    }
  } catch {}

  const list = Array.from(localUsers.values()).sort((a, b) => b.rating - a.rating);
  return res.json(
    list.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      username: u.username,
      rating: u.rating,
      gamesPlayed: u.gamesPlayed,
      wins: u.wins,
      losses: u.losses,
    }))
  );
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`⚡ HTTP backend running at http://localhost:${PORT}`);
});