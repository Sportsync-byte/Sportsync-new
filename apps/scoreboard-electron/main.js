const { app, BrowserWindow } = require('electron');
const path = require('path');

const SCOREBOARD_URL = process.env.SCOREBOARD_URL;
const KIOSK = process.env.KIOSK === 'true';

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: KIOSK,
    kiosk: KIOSK,
    autoHideMenuBar: true,
    backgroundColor: '#0a0e12',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (SCOREBOARD_URL) {
    win.loadURL(SCOREBOARD_URL);
  } else {
    win.loadFile(path.join(__dirname, '../scoreboard/dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
