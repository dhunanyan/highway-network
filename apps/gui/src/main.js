const path = require('path');
const net = require('net');
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');

const SOCKET_PATH = path.resolve(__dirname, '../../../build/highway-network.sock');
let daemonProc = null;

function canConnectToDaemon() {
  return new Promise((resolve) => {
    const client = net.createConnection(SOCKET_PATH);
    client.once('connect', () => {
      client.end();
      resolve(true);
    });
    client.once('error', () => {
      resolve(false);
    });
  });
}

function ensureDaemon() {
  return canConnectToDaemon().then((alreadyRunning) => {
    if (alreadyRunning) {
      return;
    }

  const repoRoot = path.resolve(__dirname, '../../../');
  const binPath = path.resolve(repoRoot, 'build/simulatord');
  const dataPath = path.resolve(repoRoot, 'data/input/network.csv');

    daemonProc = spawn(binPath, [dataPath, SOCKET_PATH], {
      cwd: repoRoot,
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    });

    daemonProc.unref();
  });
}

function sendCommand(command) {
  return new Promise((resolve) => {
    const client = net.createConnection(SOCKET_PATH);
    let payload = '';

    client.on('connect', () => {
      client.write(`${command}\n`);
    });

    client.on('data', (chunk) => {
      payload += chunk.toString('utf8');
    });

    client.on('end', () => {
      try {
        resolve(JSON.parse(payload.trim()));
      } catch {
        resolve({ error: 'invalid_json', details: payload.trim() });
      }
    });

    client.on('error', (err) => {
      resolve({ error: 'daemon_connection_failed', details: err.message });
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    title: 'highway-network GUI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(async () => {
  await ensureDaemon();

  ipcMain.handle('sim-state', () => sendCommand('STATE'));
  ipcMain.handle('sim-tick', (_, steps) => sendCommand(`TICK ${steps || 1}`));
  ipcMain.handle('sim-reset', () => sendCommand('RESET'));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
