import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { exec } from 'child_process';
import * as path from 'path';


interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
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

  // Open DevTools in development
  mainWindow.webContents.openDevTools();

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

// Custom paths
let customExePath: string | null = null;
let customWorkingDir: string | null = null;

// IPC Handlers for dialogs
ipcMain.handle('select-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Git-Mastery Executable',
    filters: [{ name: 'Executables', extensions: ['exe'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  customExePath = result.filePaths[0];
  return customExePath;
});

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Working Directory',
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  customWorkingDir = result.filePaths[0];
  return customWorkingDir;
});

// IPC Handler for executing gitmastery commands
ipcMain.handle('execute-command', async (_event, command: string): Promise<CommandResult> => {
  return new Promise((resolve) => {
    // Check if command has input (format: "command:input")
    let actualCommand: string;
    let userInput: string | null = null;
    let baseCommand = command;

    if (command.includes(':')) {
      const parts = command.split(':');
      baseCommand = parts[0];
      userInput = parts.slice(1).join(':'); // In case input contains colons
    }

    // Determine executable path
    const exePath = customExePath || path.join(__dirname, '../gitmastery.exe');
    
    // Replace 'gitmastery' with the path to the exe
    actualCommand = baseCommand.replace(/^gitmastery/, `"${exePath}"`);
    
    const childProcess = exec(actualCommand, { 
      encoding: 'utf8',
      shell: 'cmd.exe',
      cwd: customWorkingDir || undefined, // Use custom working dir if set
      env: process.env, // Inherit environment variables
      timeout: 30000 // 30 second timeout
    }, (error: any, stdout: string, stderr: string) => {
      if (error) {
        resolve({
          success: false,
          output: stdout || '',
          error: `${stderr || error.message}\n\nCommand: ${actualCommand}\nCWD: ${customWorkingDir || 'default'}\nExit code: ${error.code || 'N/A'}\nKilled: ${error.killed || false}`,
        });
      } else {
        resolve({
          success: true,
          output: stdout || stderr || 'Command executed successfully',
        });
      }
    });

    // If there's user input, write it to stdin
    if (userInput && childProcess.stdin) {
      childProcess.stdin.write(userInput + '\n');
      childProcess.stdin.end();
    }
  });
});
