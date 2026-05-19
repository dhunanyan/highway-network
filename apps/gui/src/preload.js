const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('simApi', {
  getState: () => ipcRenderer.invoke('sim-state'),
  tick: (steps) => ipcRenderer.invoke('sim-tick', steps),
  reset: () => ipcRenderer.invoke('sim-reset')
});
