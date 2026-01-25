// When running in Electron, the 'electron' module should be available
// But if require('electron') returns a string (path), we need to handle it differently

let electron;
try {
  electron = require('electron');
  // If it's a string, we're getting the npm package path, not the Electron API
  if (typeof electron === 'string') {
    // This shouldn't happen when running inside Electron, but let's handle it
    console.error('ERROR: require("electron") returned a path string instead of the API');
    console.error('This suggests Electron is not running correctly');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to require electron:', error);
  process.exit(1);
}

const { app, BrowserWindow } = electron;
const { exec } = require('child_process');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0a0e14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler for executing gitmastery commands
const { ipcMain } = electron;
ipcMain.handle('execute-command', async (_event, command) => {
  return new Promise((resolve) => {
    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          output: stdout || '',
          error: stderr || error.message,
        });
      } else {
        resolve({
          success: true,
          output: stdout || stderr || 'Command executed successfully',
        });
      }
    });
  });
});
