import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
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

ipcMain.handle('get-cwd', () => {
  return customWorkingDir || process.cwd();
});

// IPC Handler for executing gitmastery commands with streaming output
ipcMain.handle('execute-command', async (event, command: string, workingDirectory?: string): Promise<void> => {
  return new Promise((resolve) => {
    // Check if command has input (format: "command:input")
    let userInput: string | null = null;
    let baseCommand = command;

    if (command.includes(':')) {
      const parts = command.split(':');
      baseCommand = parts[0];
      userInput = parts.slice(1).join(':'); // In case input contains colons
    }

    // Determine executable path
    const exePath = customExePath || path.join(__dirname, '../gitmastery.exe');

    // Parse command into executable and args
    // Replace 'gitmastery' with the path to the exe
    const commandWithPath = baseCommand.replace(/^gitmastery/, `"${exePath}"`);

    // Parse command string into command and arguments
    // For Windows, we need to handle quoted paths properly
    const args: string[] = [];
    let currentArg = '';
    let inQuotes = false;

    for (let i = 0; i < commandWithPath.length; i++) {
      const char = commandWithPath[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (currentArg) {
          args.push(currentArg);
          currentArg = '';
        }
      } else {
        currentArg += char;
      }
    }
    if (currentArg) {
      args.push(currentArg);
    }

    const executable = args.shift() || exePath;

    // Use the provided working directory, fall back to customWorkingDir or undefined
    const cwd = workingDirectory || customWorkingDir || undefined;

    // Spawn the process
    const childProcess = spawn(executable, args, {
      cwd,
      env: process.env,
      shell: true, // Use shell for Windows compatibility
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';
    let hasError = false;

    // Handle stdout data
    childProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString('utf8');
      stdoutBuffer += text;

      // Split by newlines and emit complete lines
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || ''; // Keep incomplete line in buffer

      lines.forEach(line => {
        if (line) {
          event.sender.send('command-output-line', line);
        }
      });
    });

    // Handle stderr data
    childProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString('utf8');
      stderrBuffer += text;

      // Split by newlines and emit complete lines
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() || ''; // Keep incomplete line in buffer

      lines.forEach(line => {
        if (line) {
          event.sender.send('command-output-line', line);
        }
      });
    });

    // Handle process errors
    childProcess.on('error', (error: Error) => {
      hasError = true;
      event.sender.send('command-complete', {
        success: false,
        output: stdoutBuffer + stderrBuffer,
        error: `Failed to execute command: ${error.message}`,
      });
      resolve();
    });

    // Handle process exit
    childProcess.on('close', (code: number | null) => {
      // Send any remaining buffered output
      if (stdoutBuffer) {
        event.sender.send('command-output-line', stdoutBuffer);
      }
      if (stderrBuffer) {
        event.sender.send('command-output-line', stderrBuffer);
      }

      if (!hasError) {
        const success = code === 0;
        event.sender.send('command-complete', {
          success,
          output: success ? 'Command completed successfully' : `Command exited with code ${code}`,
          error: success ? undefined : `Exit code: ${code}`,
        });
      }
      resolve();
    });

    // If there's user input, write it to stdin
    if (userInput && childProcess.stdin) {
      childProcess.stdin.write(userInput + '\n');
      childProcess.stdin.end();
    }
  });
});
