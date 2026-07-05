# SportSync Scoreboard (Electron)

Native desktop wrapper for the SportSync scoreboard web app. Use this on venue TV hardware when you want a dedicated app window instead of a browser.

## Development

```bash
# Build the scoreboard web app, then launch Electron
npm run build -w @sportsync/scoreboard
npm run start -w @sportsync/scoreboard-electron
```

Point at a running dev server:

```bash
SCOREBOARD_URL=http://localhost:5176/display npm run start -w @sportsync/scoreboard-electron
```

## Kiosk mode

```bash
KIOSK=true npm run start -w @sportsync/scoreboard-electron
```

## Production installer

```bash
npm run dist -w @sportsync/scoreboard-electron
```

Outputs platform installers under `apps/scoreboard-electron/dist/`.
