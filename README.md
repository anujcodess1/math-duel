# Math Duel 1v1 - Real-Time Multiplayer Battle Arena

A high-performance, real-time multiplayer 1v1 mental math dueling application built on a modern TypeScript monorepo architecture. Players duel live across 60-second speed matches, solving rapid math equations within 5 seconds to build multiplier streaks, climb competitive ELO ranks, and earn achievement badges.

---

## System Architecture

```mermaid
graph TD
    Client["Frontend SPA (React 19, Vite/Bun, TailwindCSS)"]
    HTTP["HTTP Backend (Express, JWT Auth, Bun) :4000"]
    WS["WebSocket Backend (ws, Realtime Game Engine) :8080"]
    DB[("PostgreSQL Database via Prisma ORM")]

    Client -->|REST API /auth, /api/me, /api/leaderboard| HTTP
    Client <-->|Full-Duplex WS Tick, Duel HUD, Submissions| WS
    HTTP --> DB
    WS --> DB
```

### Monorepo Structure (Turborepo)

- **`apps/frontend`**: React 19 single-page application styled in a Dark Black (`#0a0a0a`) & Lime Green (`#84cc16`) theme with 100% SVG iconography, zero emojis, Netflix-inspired frosted glass login aesthetics, and streamlined gameplay HUD.
- **`apps/http-backend`**: REST API powering user authentication (JWT + bcrypt), profile management, global leaderboards, and database synchronization.
- **`apps/ws-backend`**: Real-time WebSocket battle server orchestrating matchmaking queues, 60s match countdowns, 5s question generation, combo streaks, live score deltas, and ELO calculations.
- **`packages/db`**: Prisma ORM schema, migrations, database adapter, and TypeScript client definitions.
- **`packages/common`**: Shared schemas, validation rules, math generators, and protocol types.
- **`packages/ui`**: Shared design system components.

---

## Features

### 1. 1v1 Real-Time Multiplayer Duel Arena
- **Synchronized 60-Second Match Clock**: Live timer ticks synchronized across duelists.
- **5-Second Rapid Equation Cycles**: Math questions auto-expire if not answered in time, applying a `-5` score penalty.
- **Streak & Combo Multipliers**: Consecutive correct answers build active combo streaks (`🔥 x3+`), increasing score yield.
- **Keyboard-First Answering**: Streamlined input with smart focus lock so players never lose keystrokes during rapid duels.

### 2. Competitive ELO & Ranking System
- Every player begins at **0 ELO**.
- Dynamic ELO changes based on duel outcomes:
  - **Victory**: `+25 ELO`
  - **Defeat**: `-15 ELO` (floor at 0)
  - **Draw**: `+5 ELO`
- **Tiers**:
  - `RECRUIT` (0 - 49 ELO)
  - `SILVER DUELIST` (50 - 149 ELO)
  - `GOLD TACTICIAN` (150 - 349 ELO)
  - `DIAMOND SAGE` (350 - 599 ELO)
  - `GRANDMASTER` (600+ ELO)

### 3. Achievement Badges & Progression
- Evaluates achievements in real time after every match:
  - **First Blood**: Win your first 1v1 duel battle.
  - **Reflex Fighter**: Complete 3 fast-paced duels.
  - **Sharpshooter**: Maintain a 60%+ win rate across 3+ battles.
  - **Hot Streak**: Win 5 competitive matches.
  - **Silver / Gold / Diamond / Grandmaster**: Reach tier rating milestones.
  - **Duel Veteran**: Complete 15+ duels.
- Unlocked badges are celebrated directly on the post-match scoreboard and highlighted on user profiles.

### 4. Persistent Post-Game Scoreboard
- Remains on screen until the user explicitly navigates back or queues again.
- Full breakdown: final scores, ELO delta, correct vs. wrong answers, timeout penalties, and accuracy percentages.
- Background sync auto-updates the global leaderboard and profile ratings in real time.

### 5. Design & Visual Identity
- High-contrast **Dark Black (`#0a0a0a`)** canvas paired with electric **Lime Green (`#84cc16`)** accents.
- **100% SVG Iconography**: Zero emojis used across the application.
- **Cinematic Login Page**: Netflix-style ambient wallpaper with 3D frosted glass mathematical symbol tiles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime & Package Manager** | [Bun](https://bun.sh/) (v1.4+) |
| **Monorepo Engine** | [Turborepo](https://turbo.build/repo) (v2.x) |
| **Frontend** | React 19, TypeScript, TailwindCSS, Poppins / Inter Typography |
| **Backend API** | Express, JSON Web Tokens (JWT), Bun Password Hashing |
| **Realtime Engine** | WebSocket (`ws`), Custom Matchmaking & Duel Manager |
| **Database & ORM** | PostgreSQL, Prisma ORM 7.x |

---

## Getting Started

### Prerequisites
- Install **[Bun](https://bun.sh/)** (v1.4+):
  - **macOS / Linux**: `curl -fsSL https://bun.sh/install | bash`
  - **Windows (PowerShell)**: `powershell -c "irm bun.sh/install.ps1 | iex"`
- *(Optional)* PostgreSQL instance running on port 5432 or custom port. If PostgreSQL is offline, the backend automatically runs in in-memory mode seamlessly!

---

### Quickstart (Simple 2-Step Setup)

Clone the repository and install dependencies:

```bash
git clone https://github.com/anujcodess1/math-duel.git
cd math-duel
bun install
```

> **Note:** `bun install` automatically triggers `postinstall` to generate the latest Prisma Client definitions for `@repo/db`. No manual setup steps or shell scripts required!

---

### Starting the Application

Start all services (Frontend, HTTP Backend, and WebSocket Backend) concurrently with Turborepo:

```bash
bun run dev
```

Once running, access the services:
- **Frontend Web UI:** [http://localhost:3000](http://localhost:3000)
- **HTTP REST Backend:** [http://localhost:4000](http://localhost:4000)
- **WebSocket Battle Server:** `ws://localhost:8080`

You can also run individual services as needed:
```bash
bun run dev:frontend   # Starts React frontend on port 3000
bun run dev:http       # Starts HTTP Express API on port 4000
bun run dev:ws         # Starts WebSocket battle engine on port 8080
```

---

### Environment Variables & Configuration

Pre-configured `.env.example` files are provided in each directory:
- Root: [`.env.example`](.env.example)
- Database: [`packages/db/.env.example`](packages/db/.env.example)
- HTTP Backend: [`apps/http-backend/.env.example`](apps/http-backend/.env.example)
- WebSocket Backend: [`apps/ws-backend/.env.example`](apps/ws-backend/.env.example)

Default values:
```env
# HTTP Backend
PORT=4000
JWT_SECRET="math-duel-super-secret-jwt-key"

# WebSocket Backend
WS_PORT=8080

# Database (Optional - in-memory fallback active if DB offline)
DATABASE_URL="postgres://postgres:postgres@localhost:5432/mathduel?sslmode=disable"
```

---

### Available Scripts

| Command | Description |
|---|---|
| `bun install` | Installs dependencies across all workspaces and auto-generates Prisma Client |
| `bun run dev` | Runs all microservices concurrently via Turborepo |
| `bun run dev:frontend` | Runs only the React frontend on `http://localhost:3000` |
| `bun run dev:http` | Runs only the HTTP backend API on `http://localhost:4000` |
| `bun run dev:ws` | Runs only the WebSocket engine on `ws://localhost:8080` |
| `bun run db:generate` | Generates the latest Prisma client definitions |
| `bun run build` | Builds frontend and production bundles |
| `bun run check-types` | Type-checks all TypeScript files across the monorepo |
| `bun run lint` | Lints the codebase |

---

## API & WebSocket Protocol

### HTTP Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new player account (Starts at 0 ELO) |
| `POST` | `/auth/login` | Authenticate and obtain JWT bearer token |
| `GET` | `/api/me` | Fetch authenticated player profile, rating, and records |
| `GET` | `/api/leaderboard` | Retrieve top ranked players sorted by ELO |
| `POST` | `/api/admin/clean-db` | Reset database and zero out all player data |

### WebSocket Messages

- **Client $\to$ Server**:
  - `FIND_MATCH`: Enter matchmaking queue (supports `vsBot: boolean`).
  - `CANCEL_MATCHMAKING`: Leave matchmaking queue.
  - `CHALLENGE_USER`: Send direct duel invite to active lobby user.
  - `SUBMIT_ANSWER`: Submit answer for current equation (`{ questionId, answer }`).
- **Server $\to$ Client**:
  - `ONLINE_USERS_UPDATE`: Real-time list of connected players and statuses (`ONLINE`, `SEARCHING`, `IN_GAME`).
  - `GAME_STARTED`: Opponent profile, match duration, and room assignment.
  - `NEW_QUESTION`: Math equation payload (`{ id, text, timeLimit: 5 }`).
  - `ANSWER_RESULT`: Score delta, combo streak, and accuracy feedback.
  - `TIME_TICK`: Remaining match seconds.
  - `GAME_OVER`: Final scores, winner ID, player stats, and ELO results.

---

## License

MIT License. Designed and engineered for high-intensity multiplayer competition.
