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
| **Website** | 5175 | Public marketing site (sportsync.com) |
| **Dashboard** | 5173 | Venue host portal — competitions, scoreboards, SMS |
| **Scorer** | 5174 | Tablet-first live scoring app |
| **Scoreboard** | 5176 | TV display app — licence key activation |

## Architecture

```
sportsync/
├── apps/
│   ├── api/                 # REST API + Socket.IO + MongoDB
│   ├── dashboard/           # Venue admin portal
│   ├── scorer/              # Tablet live scoring
│   ├── scoreboard/          # TV display (PWA + licence activation)
│   ├── scoreboard-electron/ # Native desktop wrapper for venue TVs
│   └── website/             # Marketing site
└── packages/
    ├── shared/              # Domain types, fixtures, ladder, sport helpers
    ├── sport-rules/         # Scoring engines per sport
    └── api-client/          # Shared fetch client for frontends
```

### Sports supported

| Sport | Scoring | Stats |
|-------|---------|-------|
| Indoor cricket | Runs, wickets, overs | Runs, wickets, catches |
| Indoor netball | Goals per quarter | Goals, assists |
| Indoor football | Goals per half | Goals, assists |
| Basketball | 2pt/3pt baskets per quarter | Points, assists |
| Touch rugby | Tries per half | Tries, assists |
| Outdoor cricket | Same engine, 11-a-side T20 format | Runs, wickets |
| Outdoor football | Same engine, 11-a-side halves | Goals, assists |
| Outdoor netball | Same engine, 15-min quarters | Goals, assists |
| Rugby union | Try-based (15-a-side) | Tries, assists |
| Rugby league | Try-based (13-a-side) | Tries, assists |

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
npm install            # auto-builds @sportsync/shared (required for TypeScript)
npm run build:packages # shared → sport-rules → api-client (required before API build)
cp apps/api/.env.example apps/api/.env
npm run seed          # Creates demo venue, 6 teams, competition, fixtures
```

If you see `Cannot find module '@sportsync/shared'` in `packages/sport-rules`, shared was not built yet:

```bash
npm run build -w @sportsync/shared
npm run build:packages
```

If `tsc` reports success but `dist/` is still empty, delete stale cache and rebuild:

```bash
rm packages/shared/tsconfig.tsbuildinfo
npm run build -w @sportsync/shared
```

### Run

```bash
npm run dev:api         # Terminal 1
npm run dev:website     # Terminal 2 — http://localhost:5175
npm run dev:dashboard   # Terminal 3 — http://localhost:5173
npm run dev:scorer      # Terminal 4 — http://localhost:5174
npm run dev:scoreboard  # Terminal 5 — http://localhost:5176 (TV display)
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
- **Venue licence keys** — one key per venue, activates scoreboard displays
- **Scoreboard PC app** — install on TV hardware, pairs via licence key over internet
- **SMS fixture reminders** — Stadium tier (Twilio), manual send + automated scheduler
- **Automated SMS reminders** — configurable hours before fixture, player phone numbers, opt-out per player
- **Stripe checkout for extra scoreboard licences** — purchase add-ons from dashboard
- **Indoor football** — 5-a-side scoring, scorer UI, TV scoreboard display
- **Basketball** — 4-quarter scoring with 2pt/3pt baskets, scorer and scoreboard UI
- **Touch rugby** — 6-a-side, 2 halves, try scoring with undo, scorer and scoreboard UI
- **Electron auto-start** — login item on Windows/macOS; systemd unit for Linux TVs
- **Docker Compose** — API + MongoDB for local/staging deploy
- **Auth hardening** — JWT required on write routes with venue scoping; socket scoring auth
- **Scoreboard Electron app** — native desktop wrapper for TV hardware
- **Scoreboard PWA kiosk mode** — installable app with fullscreen display
- **Marketing website** — landing page, pricing, venue login CTA
- **Branded venue host login** — competition management portal
- Real-time Socket.IO updates
- Offline ball queue with sync on reconnect
- Public live scores search (no login)
- TV scoreboard display mode

## Demo login

After running `npm run seed`:

- **Email:** admin@sportsync.local
- **Password:** admin123

## Licence key & scoreboards

Each venue gets a unique licence key (`SSYNC-XXXX-XXXX-XXXX`). Install the **Scoreboard app** on each TV/display PC:

1. Open http://localhost:5176/activate
2. Enter your venue licence key (shown in Dashboard → Scoreboards)
3. Name the display (e.g. "Court 1 TV")
4. Assign the scoreboard to a court in the dashboard — it auto-shows live matches

| Tier | Scoreboards included | Extra scoreboards |
|------|---------------------|-------------------|
| Club | 1 | Purchase add-ons |
| Stadium | 4 | +$29/mo each (via dashboard) |

## SMS notifications (Stadium)

Configure Twilio in `apps/api/.env`, enable SMS in Venue Settings, then:

- **Manual reminders** — send from the competition fixtures tab
- **Automated reminders** — enable "Auto SMS reminders" in Venue Settings; players with phone numbers on roster receive reminders before fixtures (scheduler runs every 15 min)

Set `STRIPE_SCOREBOARD_PRICE_ID` for Stripe checkout when purchasing extra scoreboard licences.

## Docker (API + MongoDB)

```bash
cp apps/api/.env.example apps/api/.env   # optional — compose sets defaults
docker compose up --build
```

API listens on http://localhost:3001. Run `npm run seed` against the container MongoDB to load demo data.

### Full stack with static frontends

Build frontends first, then start nginx + API:

```bash
npm run build -w @sportsync/dashboard
npm run build -w @sportsync/scorer
npm run build -w @sportsync/scoreboard
npm run build -w @sportsync/website
docker compose -f docker-compose.full.yml up --build
```

| URL | App |
|-----|-----|
| http://localhost:8080 | Dashboard |
| http://localhost:8081 | Scorer |
| http://localhost:8082 | Scoreboard |
| http://localhost:8083 | Website |

## Production checklist

Before going live, update `apps/api/.env`:

| Variable | Production value |
|----------|------------------|
| `JWT_SECRET` | Long random secret |
| `SOCKET_AUTH_OPTIONAL` | `false` |
| `ALLOW_PUBLIC_REGISTER` | `false` |
| `STRIPE_*` | Live Stripe keys and price IDs |
| `TWILIO_*` | Twilio credentials for SMS |
| `CORS_ORIGIN` | Your deployed dashboard/scorer/scoreboard URLs |

Scorers must log in via the Scorer app so socket scoring events include a JWT.

## Roadmap

- [x] Electron auto-start on boot (systemd / Windows startup)
- [x] Touch rugby sport module
- [x] Goal-sport stats for all team sports (netball, football, basketball, touch rugby)
- [x] Outdoor sport variants (cricket, football, netball)
- [x] Rugby union / rugby league modules
- [x] Hosted deploy templates (static frontends + API via `docker-compose.full.yml`)
- [ ] End-to-end integration tests
- [x] Court management in dashboard
- [x] Scorer login for production socket auth
- [x] SMS roster send from fixtures
- [x] Venue scoping on billing, notifications, scoreboards, export
- [x] Native scoreboard installer polish (single-instance, kiosk defaults)
- [x] Football undo in scorer
- [x] Goal-sport stats refactor (netball, football, basketball, touch rugby)
- [x] SMS phone validation and player opt-out
- [x] GitHub Actions CI pipeline
- [x] Additional sports modules (basketball)
- [x] Native scoreboard installer (Electron)
- [x] Auth hardening on write routes
- [x] Automated scheduled SMS before fixtures
- [x] Stripe checkout for extra scoreboard licences
- [x] Indoor football sport module
- [x] Scoreboard PWA kiosk mode

## License

Proprietary — All rights reserved.
