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

  // Open DevTools in development only
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

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

// Helper function to get the correct gitmastery executable based on platform
function getGitMasteryExecutable(): string {
  if (customExePath) {
    return customExePath;
  }

  if (process.platform === 'darwin') {
    // On macOS, use Homebrew-installed gitmastery
    return 'gitmastery';
  } else {
    // On Windows, use bundled executable
    return path.join(__dirname, '../gitmastery.exe');
  }
}

// Helper function to get environment with Homebrew paths added
function getEnvironmentWithHomebrew(): NodeJS.ProcessEnv {
  const env = { ...process.env };

  if (process.platform === 'darwin') {
    // On macOS, add common Homebrew paths to PATH
    const homebrewPaths = [
      '/opt/homebrew/bin',      // Apple Silicon Macs
      '/usr/local/bin',         // Intel Macs
      '/opt/homebrew/sbin',
      '/usr/local/sbin'
    ];

    // Standard system paths that should always be included
    const systemPaths = [
      '/usr/bin',
      '/bin',
      '/usr/sbin',
      '/sbin'
    ];

    // Get current PATH or use system paths as fallback
    const currentPath = env.PATH || systemPaths.join(':');

    // Combine Homebrew paths with current PATH
    // Put Homebrew paths first so they take precedence
    const allPaths = [...homebrewPaths, ...currentPath.split(':')];

    // Remove duplicates while preserving order
    const uniquePaths = Array.from(new Set(allPaths)).filter(p => p.length > 0);

    env.PATH = uniquePaths.join(':');

    // Debug logging to help diagnose PATH issues
    console.log('Enhanced PATH for macOS:', env.PATH);
  }

  return env;
}

// IPC Handler to get current platform
ipcMain.handle('get-platform', () => {
  return process.platform;
});

// IPC Handler to check if gitmastery is installed
ipcMain.handle('check-gitmastery-installed', async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (process.platform === 'darwin') {
      // On macOS, check if gitmastery is in PATH
      const checkProcess = spawn('which', ['gitmastery'], {
        shell: true,
      });

      checkProcess.on('close', (code: number | null) => {
        resolve(code === 0);
      });

      checkProcess.on('error', () => {
        resolve(false);
      });
    } else {
      // On Windows, check if exe exists
      const exePath = customExePath || path.join(__dirname, '../gitmastery.exe');
      const fs = require('fs');
      resolve(fs.existsSync(exePath));
    }
  });
});

// IPC Handler to install gitmastery via Homebrew (macOS only)
ipcMain.handle('install-gitmastery', async (event): Promise<void> => {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') {
      event.sender.send('command-complete', {
        success: false,
        output: '',
        error: 'Installation via Homebrew is only available on macOS',
      });
      resolve();
      return;
    }

    // Run Homebrew installation commands
    const installCommand = 'brew tap git-mastery/gitmastery && brew install gitmastery';

    const installProcess = spawn(installCommand, [], {
      shell: true,
      env: getEnvironmentWithHomebrew(),
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';
    let hasError = false;

    installProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString('utf8');
      stdoutBuffer += text;

      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || '';

      lines.forEach(line => {
        if (line) {
          event.sender.send('command-output-line', line);
        }
      });
    });

    installProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString('utf8');
      stderrBuffer += text;

      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() || '';

      lines.forEach(line => {
        if (line) {
          event.sender.send('command-output-line', line);
        }
      });
    });

    installProcess.on('error', (error: Error) => {
      hasError = true;
      event.sender.send('command-complete', {
        success: false,
        output: stdoutBuffer + stderrBuffer,
        error: `Failed to install gitmastery: ${error.message}`,
      });
      resolve();
    });

    installProcess.on('close', (code: number | null) => {
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
          output: success ? 'GitMastery installed successfully via Homebrew' : `Installation failed with code ${code}`,
          error: success ? undefined : `Exit code: ${code}`,
        });
      }
      resolve();
    });
  });
});

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
    // Only parse input for specific interactive commands to avoid breaking URLs with colons
    let userInput: string | null = null;
    let baseCommand = command;

    // List of commands that expect stdin input
    const interactiveCommands = ['gitmastery setup'];

    // Check if this is an interactive command that needs input
    const isInteractiveCommand = interactiveCommands.some(cmd => command.startsWith(cmd + ':'));

    if (isInteractiveCommand && command.includes(':')) {
      const colonIndex = command.indexOf(':');
      baseCommand = command.substring(0, colonIndex);
      userInput = command.substring(colonIndex + 1); // Everything after the first colon
    }

    // Determine executable path
    const exePath = getGitMasteryExecutable();

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

    // Properly quote arguments for PowerShell to handle special characters like ://
    // This prevents URLs and paths with special chars from being truncated
    const quotedArgs = args.map(arg => {
      // If arg contains special characters that PowerShell might misinterpret, quote it
      // if (arg.includes('://') || arg.includes('&') || arg.includes('|') || arg.includes(';')) {
      //   // Escape any internal quotes and wrap in quotes
      //   return `"${arg.replace(/"/g, '\\"')}"`;
      // }
      return arg;
    });

    console.log('Executable:', executable);
    console.log('Quoted Args:', quotedArgs);

    // Use the provided working directory, fall back to customWorkingDir or undefined
    const cwd = workingDirectory || customWorkingDir || undefined;

    // Spawn the process
    const childProcess = spawn(executable, quotedArgs, {
      cwd,
      env: getEnvironmentWithHomebrew(),
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
