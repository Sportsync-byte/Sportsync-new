const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('sportsyncElectron', {
  isElectron: true,
});
