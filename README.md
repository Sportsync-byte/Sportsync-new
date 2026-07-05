# SportSync

All-in-one sports competition management and live scoring platform.

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

## Architecture

```
sportsync/
├── apps/
│   ├── api/              # REST API + Socket.IO + MongoDB
│   ├── dashboard/        # Admin portal (competitions, teams, players, live scores)
│   └── scorer/           # Live scoring + TV scoreboard display
└── packages/
    ├── shared/           # Domain types, fixture generator, ladder calculator
    ├── sport-rules/      # Indoor cricket scoring engine
    └── api-client/       # Shared fetch client for frontends
```

## End-to-end flow

1. **Venue** — Create venue with courts (or run seed for demo data)
2. **Teams & Players** — Register teams and player rosters
3. **Competition** — Create competition, assign teams, generate round-robin fixtures
4. **Start Match** — From dashboard or scorer, start a fixture → creates live match
5. **Score** — Scorer app: select batters, bowler, record runs/extras/wickets, undo
6. **Live Updates** — Socket.IO pushes to scoreboard display and live scores page
7. **Complete** — Match end auto-updates fixture result and recalculates ladder

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB

### Install & seed

```bash
npm install
npm run build -w @sportsync/shared
npm run build -w @sportsync/sport-rules
npm run build -w @sportsync/api-client
cp apps/api/.env.example apps/api/.env
npm run seed          # Creates demo venue, 6 teams, competition, fixtures
```

### Run

```bash
npm run dev:api         # Terminal 1
npm run dev:dashboard   # Terminal 2 — http://localhost:5173
npm run dev:scorer      # Terminal 3 — http://localhost:5174
```

### Test the flow

1. Open dashboard → select "Action Indoor Sports Christchurch"
2. Go to Competitions → open "Summer Indoor Cricket 2026"
3. Click **Generate Fixtures** (if not already generated)
4. Click **Start** on any fixture → opens scorer
5. Select batters and bowler, then score the game
6. Open `/display/{matchId}` for TV scoreboard view
7. Check Live Scores page and Ladder tab after match completes

## Features implemented

- Venue, court, team, player, competition, fixture CRUD
- Round-robin fixture generation (single and double)
- Automatic ladder with bonus points
- Indoor cricket scoring: 6s/8s/Asia Cup formats
- Runs 0–7, extras, dismissals (-5), strike rotation, undo
- Partnership and bowler selection prompts
- Innings transitions and match completion
- Real-time Socket.IO updates
- Offline ball queue with sync on reconnect
- Public live scores search (no login)
- TV scoreboard display mode

## Roadmap

- [ ] Authentication and role-based access
- [ ] Venue branding on scoreboards
- [ ] Timer with automatic siren
- [ ] Player statistics aggregation
- [ ] Additional sports (netball, basketball, football)
- [ ] Subscription tiers (Club / Stadium)
- [ ] PDF/CSV export

## License

Proprietary — All rights reserved.
