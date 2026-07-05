# SportSync

All-in-one sports competition management and live scoring platform.

SportSync replaces multiple disconnected systems (competition management, fixtures, live scoreboards, digital scoring, statistics, and club websites) with a single ecosystem built around one platform supporting many sports.

## Products

| Product | Audience | Key capabilities |
|---------|----------|------------------|
| **SportSync Club** | Single-venue clubs | Fixtures, ladders, live scoreboards, mobile scoring, player stats |
| **SportSync Stadium** | Multi-court venues | Court scheduling, multi-sport competitions, venue branding, multiple admins |

## Applications

| App | Port | Purpose |
|-----|------|---------|
| **API** | 3001 | Express + MongoDB + Socket.IO backend |
| **Dashboard** | 5173 | Stadium administrator portal |
| **Scorer** | 5174 | Tablet-first live scoring app |

The marketing website is planned for Wix; these apps cover the operational platform.

## Architecture

```
sportsync/
├── apps/
│   ├── api/           # Node.js + Express + MongoDB + Socket.IO
│   ├── dashboard/     # React admin portal (Vite)
│   └── scorer/        # React scoring app (Vite, tablet-optimised)
└── packages/
    ├── shared/        # Domain types, socket events, sport IDs
    └── sport-rules/   # Pluggable scoring engines per sport
```

### Core philosophy

Every sport shares fixtures, ladders, finals, teams, players, venues, live scoring, and statistics. Only the scoring rules change — making new sports straightforward to add.

Indoor cricket is the first fully modelled sport, including 6-aside, 8-aside, and Asia Cup formats.

## Tech stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Real-time:** Socket.IO

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Install

```bash
npm install
```

### Build shared packages

```bash
npm run build -w @sportsync/shared
npm run build -w @sportsync/sport-rules
```

### Run development servers

```bash
# Terminal 1 — API (requires MongoDB)
cp apps/api/.env.example apps/api/.env
npm run dev:api

# Terminal 2 — Dashboard
npm run dev:dashboard

# Terminal 3 — Scorer
npm run dev:scorer
```

### Run tests

```bash
npm test -w @sportsync/sport-rules
```

## Indoor cricket scoring

The `@sportsync/sport-rules` package implements the indoor cricket engine:

- Run values 0–7, extras (wide, no-ball, leg side wide, byes, leg byes)
- Automatic -5 penalty on dismissals (team and batter)
- Strike rotation with manual override
- Undo last ball
- Scoreboard display state for live TVs

Socket events (`match:ball`, `match:undo`, `scoreboard:update`) propagate changes instantly to connected scorers and scoreboards.

## Roadmap

- [ ] Competition, division, and fixture CRUD
- [ ] Player and team management
- [ ] Automatic ladder and standings
- [ ] Offline scoring with sync queue
- [ ] Remote scoreboard display mode
- [ ] Venue branding and sponsor banners
- [ ] Subscription tiers (Club / Stadium)
- [ ] Additional sports (netball, basketball, football, rugby)
- [ ] Live streaming score overlay integration

## License

Proprietary — All rights reserved.
