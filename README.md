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
- **Innings timer with siren** (countdown, start/pause/reset, TV display)
- **Player statistics** aggregated per match and season
- **JWT authentication** with roles (owner, admin, competition-manager, scorer, viewer)
- **Venue branding** on scoreboard displays (colours, logo, sponsor banner)
- **Indoor netball** sport module (types + scoring engine foundation)
- **Netball scorer UI** end-to-end with quarter timer and TV display
- **Public player profiles** with search (no login required to view)
- **CSV export** for ladder, statistics, and scorecards
- **PDF export** for ladder and match scorecards
- **Netball player goal statistics** aggregated per match and season
- **Stripe subscription billing** with checkout and webhooks for Stadium tier upgrades
- **Public player profile URLs** via unique slugs (`/p/:slug`)
- **Subscription tiers** — Club vs Stadium limits enforced on competitions
- **Sport-aware live scores** for cricket and netball
- **Court scheduling** with automatic court/time assignment on fixture generation
- **Multi-court live view** dashboard with real-time Socket.IO updates
- **Netball scorer** assist picker and undo last goal
- Real-time Socket.IO updates
- Offline ball queue with sync on reconnect
- Public live scores search (no login)
- TV scoreboard display mode

## Demo login

After running `npm run seed`:

- **Email:** admin@sportsync.local
- **Password:** admin123

## Roadmap

- [ ] Additional sports modules (football, basketball)
- [ ] Email notifications for fixture reminders
- [ ] Mobile app / PWA for scorers

## License

Proprietary — All rights reserved.
