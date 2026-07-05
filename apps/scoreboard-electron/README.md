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

Kiosk mode is enabled by default. Set `KIOSK=false` for windowed mode. The app uses a single-instance lock so relaunching focuses the existing window.

## Auto-start on boot

On **Windows** and **macOS**, the app registers a login item on launch (enabled by default). Disable with:

```bash
AUTO_START=false npm run start -w @sportsync/scoreboard-electron
```

On **Linux**, use the included systemd unit for venue TVs:

```bash
# Copy the AppImage or unpacked binary to /opt/sportsync/scoreboard-electron/
sudo cp apps/scoreboard-electron/linux/sportsync-scoreboard.service /etc/systemd/user/
# Edit ExecStart to match your install path and optional SCOREBOARD_URL
systemctl --user daemon-reload
systemctl --user enable --now sportsync-scoreboard.service
```

Set `AUTO_START=false` in the unit file if you only want manual launches on Linux.

## Production installer

```bash
npm run dist -w @sportsync/scoreboard-electron
```

Outputs platform installers under `apps/scoreboard-electron/dist/`.
