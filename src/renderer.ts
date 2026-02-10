// Type definitions for the Electron API exposed via preload
interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

interface ElectronAPI {
  executeCommand: (command: string, workingDirectory?: string) => Promise<void>;
  onCommandOutput: (callback: (line: string) => void) => () => void;
  onCommandComplete: (callback: (result: CommandResult) => void) => () => void;
  selectFile: () => Promise<string | null>;
  selectFolder: () => Promise<string | null>;
  getCwd: () => Promise<string>;
  getPlatform: () => Promise<string>;
  checkGitMasteryInstalled: () => Promise<boolean>;
  installGitMastery: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Make this file a module
export { };


interface HistoryEntry {
  command: string;
  result: CommandResult;
  timestamp: Date;
}

// DOM Elements
const historyContainer = document.getElementById('history') as HTMLDivElement;
const commandButtons = document.querySelectorAll('.cmd-button') as NodeListOf<HTMLButtonElement>;
const setWorkingDirBtn = document.getElementById('setWorkingDir') as HTMLButtonElement;
const setExePathBtn = document.getElementById('setExePath') as HTMLButtonElement;
const installGitMasteryBtn = document.getElementById('installGitMastery') as HTMLButtonElement;
const cwdPath = document.getElementById('cwdPath') as HTMLSpanElement;
const customCommandInput = document.getElementById('customCommandInput') as HTMLInputElement;
const downloadStartBtn = document.getElementById('downloadStart') as HTMLButtonElement;
const verifyBtn = document.getElementById('verifyBtn') as HTMLButtonElement;

// Working directory state
let currentWorkingDirectory: string = '';

// Platform state
let currentPlatform: string = '';
let isGitMasteryInstalled: boolean = false;

// ... (history array)

// Initialize CWD display and platform detection
(async () => {
  try {
    // Get current working directory
    const cwd = await window.electronAPI.getCwd();
    currentWorkingDirectory = cwd;
    cwdPath.textContent = cwd;
    cwdPath.title = cwd;

    // Get platform
    currentPlatform = await window.electronAPI.getPlatform();

    // Check if gitmastery is installed
    isGitMasteryInstalled = await window.electronAPI.checkGitMasteryInstalled();

    // Show/hide UI elements based on platform
    if (currentPlatform === 'darwin') {
      // On macOS, hide "Set Executable Path" button and show "Install GitMastery" button
      if (setExePathBtn) setExePathBtn.style.display = 'none';
      if (installGitMasteryBtn) installGitMasteryBtn.style.display = 'flex';
    } else {
      // On Windows, show "Set Executable Path" button and hide "Install GitMastery" button
      if (setExePathBtn) setExePathBtn.style.display = 'flex';
      if (installGitMasteryBtn) installGitMasteryBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to initialize:', error);
    cwdPath.textContent = 'Error fetching CWD';
  }
})();

// Custom Command Input Handler
customCommandInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const command = customCommandInput.value.trim();
    if (command) {
      customCommandInput.disabled = true;
      try {
        await handleCommand(command, { classList: { add: () => { }, remove: () => { } }, disabled: false } as any);
        customCommandInput.value = '';
      } finally {
        customCommandInput.disabled = false;
        customCommandInput.focus();
      }
    }
  }
});

// ... (Configuration Button Handlers)

setWorkingDirBtn.addEventListener('click', async () => {
  setWorkingDirBtn.disabled = true;
  try {
    const path = await window.electronAPI.selectFolder();
    if (path) {
      // Update working directory state
      currentWorkingDirectory = path;

      // Update CWD display
      cwdPath.textContent = path;
      cwdPath.title = path; // Show full path on hover

      const entry: HistoryEntry = {
        command: 'Set Working Directory',
        result: {
          success: true,
          output: `Working directory set to: ${path}`
        },
        timestamp: new Date()
      };
      history.push(entry);
      addHistoryEntry(entry);
    }
  } catch (error) {
    console.error('Failed to set working dir:', error);
  } finally {
    setWorkingDirBtn.disabled = false;
  }
});

// ... (rest of the file)
const history: HistoryEntry[] = [];

// ... (existing code for history formatting)

// Configuration Button Handlers
setExePathBtn.addEventListener('click', async () => {
  setExePathBtn.disabled = true;
  try {
    const path = await window.electronAPI.selectFile();
    if (path) {
      const entry: HistoryEntry = {
        command: 'Set Executable Path',
        result: {
          success: true,
          output: `Executable path set to: ${path}`
        },
        timestamp: new Date()
      };
      history.push(entry);
      addHistoryEntry(entry);
    }
  } catch (error) {
    console.error('Failed to set exe path:', error);
  } finally {
    setExePathBtn.disabled = false;
  }
});

// Install GitMastery button handler (macOS only)
if (installGitMasteryBtn) {
  installGitMasteryBtn.addEventListener('click', async () => {
    installGitMasteryBtn.disabled = true;
    installGitMasteryBtn.classList.add('loading');

    // Create initial history entry
    const entry: HistoryEntry = {
      command: 'Install GitMastery via Homebrew',
      result: {
        success: true,
        output: '',
      },
      timestamp: new Date(),
    };

    history.push(entry);
    clearEmptyState();

    // Create and add the entry element
    const entryDiv = document.createElement('div');
    entryDiv.className = 'history-entry success';

    const header = document.createElement('div');
    header.className = 'entry-header';

    const commandSpan = document.createElement('div');
    commandSpan.className = 'entry-command';

    const commandText = document.createTextNode(`$ ${entry.command}`);
    commandSpan.appendChild(commandText);

    const inlineSpinner = document.createElement('div');
    inlineSpinner.className = 'spinner-inline';
    commandSpan.appendChild(inlineSpinner);

    const timestamp = document.createElement('div');
    timestamp.className = 'entry-timestamp';
    timestamp.textContent = formatTimestamp(entry.timestamp);

    header.appendChild(commandSpan);
    header.appendChild(timestamp);

    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    const loadingText = document.createElement('span');
    loadingText.textContent = 'Installing GitMastery via Homebrew...';

    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingText);

    entryDiv.appendChild(header);
    entryDiv.appendChild(loadingContainer);

    historyContainer.insertBefore(entryDiv, historyContainer.firstChild);
    historyContainer.scrollTop = 0;

    let output: HTMLPreElement | null = null;
    let hasReceivedOutput: boolean = false;

    // Set up streaming listeners
    const cleanupOutput = window.electronAPI.onCommandOutput((line: string) => {
      if (!hasReceivedOutput) {
        hasReceivedOutput = true;
        loadingContainer.remove();

        output = document.createElement('pre');
        output.className = 'entry-output';
        output.textContent = line;
        entryDiv.appendChild(output);
      } else if (output) {
        output.textContent += '\n' + line;
      }

      if (output) {
        output.scrollTop = output.scrollHeight;
      }
    });

    const cleanupComplete = window.electronAPI.onCommandComplete(async (result: CommandResult) => {
      entry.result = result;
      inlineSpinner.remove();

      if (!hasReceivedOutput) {
        loadingContainer.remove();

        output = document.createElement('pre');
        output.className = `entry-output ${result.success ? '' : 'error'}`;

        if (result.success) {
          output.textContent = result.output || 'GitMastery installed successfully';
        } else {
          output.textContent = result.error || result.output || 'Installation failed';
        }

        entryDiv.appendChild(output);
      } else if (output) {
        output.className = `entry-output ${result.success ? '' : 'error'}`;

        if (!result.success && result.error) {
          if (output.textContent) {
            output.textContent += '\n\n' + result.error;
          } else {
            output.textContent = result.error;
          }
        }
      }

      entryDiv.className = `history-entry ${result.success ? 'success' : 'error'}`;

      // Update installation status
      if (result.success) {
        isGitMasteryInstalled = true;
      }

      installGitMasteryBtn.classList.remove('loading');
      installGitMasteryBtn.disabled = false;

      cleanupOutput();
      cleanupComplete();
    });

    try {
      await window.electronAPI.installGitMastery();
    } catch (error) {
      const currentOutput = output as HTMLPreElement | null;
      const errorResult: CommandResult = {
        success: false,
        output: currentOutput?.textContent || '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      entry.result = errorResult;
      entryDiv.className = 'history-entry error';
      inlineSpinner.remove();

      if (!hasReceivedOutput) {
        loadingContainer.remove();

        output = document.createElement('pre');
        output.className = 'entry-output error';
        output.textContent = errorResult.error || 'Unknown error';
        entryDiv.appendChild(output);
      } else if (currentOutput) {
        currentOutput.className = 'entry-output error';
        currentOutput.textContent += '\n\n' + (errorResult.error || 'Unknown error');
      }

      installGitMasteryBtn.classList.remove('loading');
      installGitMasteryBtn.disabled = false;

      cleanupOutput();
      cleanupComplete();
    }
  });
}


// ... (rest of the file)


// Format timestamp
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Create history entry element
function createHistoryEntry(entry: HistoryEntry): HTMLDivElement {
  const entryDiv = document.createElement('div');
  entryDiv.className = `history-entry ${entry.result.success ? 'success' : 'error'}`;

  const header = document.createElement('div');
  header.className = 'entry-header';

  const commandSpan = document.createElement('div');
  commandSpan.className = 'entry-command';
  commandSpan.textContent = `$ ${entry.command}`;

  const timestamp = document.createElement('div');
  timestamp.className = 'entry-timestamp';
  timestamp.textContent = formatTimestamp(entry.timestamp);

  header.appendChild(commandSpan);
  header.appendChild(timestamp);

  const output = document.createElement('pre');
  output.className = `entry-output ${entry.result.success ? '' : 'error'}`;

  if (entry.result.success) {
    output.textContent = entry.result.output;
  } else {
    output.textContent = entry.result.error || entry.result.output || 'Command failed';
  }

  entryDiv.appendChild(header);
  entryDiv.appendChild(output);

  return entryDiv;
}

// Parse output line for cd command suggestions from gitmastery
function parseOutputForCd(line: string): string | null {
  // Match patterns like:
  // "INFO  cd staging-intervention/intervention"
  // "cd staging-intervention/intervention"
  // " INFO  cd path/to/dir"
  const cdMatch = line.match(/(?:INFO\s+)?cd\s+(.+?)$/i);
  if (!cdMatch) return null;

  let targetPath = cdMatch[1].trim();

  // Remove quotes if present
  if ((targetPath.startsWith('"') && targetPath.endsWith('"')) ||
    (targetPath.startsWith("'") && targetPath.endsWith("'"))) {
    targetPath = targetPath.slice(1, -1);
  }

  return targetPath;
}

// Parse cd command and update working directory
function clearEmptyState(): void {
  const emptyState = historyContainer.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }
}

// Add entry to history display
function addHistoryEntry(entry: HistoryEntry): void {
  clearEmptyState();

  const entryElement = createHistoryEntry(entry);

  // Insert at the beginning (latest at top)
  historyContainer.insertBefore(entryElement, historyContainer.firstChild);

  // Scroll to top to show the latest entry
  historyContainer.scrollTop = 0;
}

// Parse cd command and update working directory
function parseCdCommand(command: string): string | null {
  const trimmed = command.trim();

  // Match: cd <path> or cd "<path>"
  const cdMatch = trimmed.match(/^cd\s+(.+)$/i);
  if (!cdMatch) return null;

  let targetPath = cdMatch[1].trim();

  // Remove quotes if present
  if ((targetPath.startsWith('"') && targetPath.endsWith('"')) ||
    (targetPath.startsWith("'") && targetPath.endsWith("'"))) {
    targetPath = targetPath.slice(1, -1);
  }

  return targetPath;
}

// Resolve path relative to current working directory
function resolvePath(targetPath: string, basePath: string): string {
  // Determine the path separator based on the base path
  // If basePath contains forward slashes, use forward slashes (Unix/macOS)
  // Otherwise use backslashes (Windows)
  const separator = basePath.includes('/') ? '/' : '\\';

  // Handle absolute paths (Windows: C:\... or \\... , Unix: /...)
  if (/^[a-zA-Z]:\\/.test(targetPath) || targetPath.startsWith('\\\\') || targetPath.startsWith('/')) {
    return targetPath;
  }

  // Handle relative paths
  const parts = basePath.split(/[\\\/]/);
  const targetParts = targetPath.split(/[\\\/]/);

  for (const part of targetParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }

  return parts.join(separator);
}

// Handle command (intercept cd or execute normally)
async function handleCommand(command: string, button: HTMLButtonElement): Promise<void> {
  const cdPath = parseCdCommand(command);

  if (cdPath !== null) {
    // Handle cd command
    const newPath = resolvePath(cdPath, currentWorkingDirectory);
    currentWorkingDirectory = newPath;

    // Update UI
    cwdPath.textContent = newPath;
    cwdPath.title = newPath;

    // Add to history
    const entry: HistoryEntry = {
      command,
      result: {
        success: true,
        output: `Changed directory to: ${newPath}`
      },
      timestamp: new Date()
    };
    history.push(entry);
    addHistoryEntry(entry);
  } else {
    // Execute normal command
    await executeCommand(command, button);
  }
}

// Execute command with streaming output
async function executeCommand(command: string, button: HTMLButtonElement): Promise<void> {
  // Disable button and show loading state
  button.classList.add('loading');
  button.disabled = true;

  // Create initial history entry with empty output
  const entry: HistoryEntry = {
    command,
    result: {
      success: true,
      output: '',
    },
    timestamp: new Date(),
  };

  history.push(entry);
  clearEmptyState();

  // Create and add the entry element
  const entryDiv = document.createElement('div');
  entryDiv.className = 'history-entry success';

  const header = document.createElement('div');
  header.className = 'entry-header';

  const commandSpan = document.createElement('div');
  commandSpan.className = 'entry-command';

  // Add command text
  const commandText = document.createTextNode(`$ ${command}`);
  commandSpan.appendChild(commandText);

  // Add inline spinner next to command text (persists until completion)
  const inlineSpinner = document.createElement('div');
  inlineSpinner.className = 'spinner-inline';
  commandSpan.appendChild(inlineSpinner);

  const timestamp = document.createElement('div');
  timestamp.className = 'entry-timestamp';
  timestamp.textContent = formatTimestamp(entry.timestamp);

  header.appendChild(commandSpan);
  header.appendChild(timestamp);

  // Create loading container with spinner for code block (disappears on first output)
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'loading-container';

  const spinner = document.createElement('div');
  spinner.className = 'spinner';

  const loadingText = document.createElement('span');
  loadingText.textContent = 'Loading...';

  loadingContainer.appendChild(spinner);
  loadingContainer.appendChild(loadingText);

  entryDiv.appendChild(header);
  entryDiv.appendChild(loadingContainer);

  // Insert at the beginning (latest at top)
  historyContainer.insertBefore(entryDiv, historyContainer.firstChild);
  historyContainer.scrollTop = 0;

  let output: HTMLPreElement | null = null;
  let hasReceivedOutput: boolean = false;

  // Set up streaming listeners
  const cleanupOutput = window.electronAPI.onCommandOutput((line: string) => {
    // Check if this line contains a cd command suggestion
    const cdPath = parseOutputForCd(line);
    if (cdPath !== null) {
      // Automatically change directory
      const newPath = resolvePath(cdPath, currentWorkingDirectory);
      currentWorkingDirectory = newPath;

      // Update UI
      cwdPath.textContent = newPath;
      cwdPath.title = newPath;

      // Add visual indicator in the output (optional - you can remove this if you don't want it)
      line = line + ' ✓ (auto-changed directory)';
    }

    // On first output, replace loading container with output element
    if (!hasReceivedOutput) {
      hasReceivedOutput = true;
      loadingContainer.remove();

      output = document.createElement('pre');
      output.className = 'entry-output';
      output.textContent = line;
      entryDiv.appendChild(output);
    } else if (output) {
      // Append subsequent lines
      output.textContent += '\n' + line;
    }

    // Auto-scroll to show new content
    if (output) {
      output.scrollTop = output.scrollHeight;
    }
  });

  const cleanupComplete = window.electronAPI.onCommandComplete((result: CommandResult) => {
    // Update the entry with final result
    entry.result = result;

    // Remove inline spinner from command header
    inlineSpinner.remove();

    // If we never received output, replace loading container with output element
    if (!hasReceivedOutput) {
      loadingContainer.remove();

      output = document.createElement('pre');
      output.className = `entry-output ${result.success ? '' : 'error'}`;

      if (result.success) {
        output.textContent = result.output || 'Command completed successfully';
      } else {
        let errorText = result.error || result.output || 'Command failed';

        // On macOS, if gitmastery is not found, add helpful message
        if (currentPlatform === 'darwin' && !isGitMasteryInstalled &&
          (errorText.includes('Permission denied') || errorText.includes('command not found') || errorText.includes('not found'))) {
          errorText += '\n\n💡 GitMastery is not installed. Click the "Install GitMastery" button in the config section to install via Homebrew.';
        }

        output.textContent = errorText;
      }

      entryDiv.appendChild(output);
    } else if (output) {
      // Update styling for existing output
      output.className = `entry-output ${result.success ? '' : 'error'}`;

      // If there was an error message, append it
      if (!result.success && result.error) {
        let errorText = result.error;

        // On macOS, if gitmastery is not found, add helpful message
        if (currentPlatform === 'darwin' && !isGitMasteryInstalled &&
          (errorText.includes('Permission denied') || errorText.includes('command not found') || errorText.includes('not found'))) {
          errorText += '\n\n💡 GitMastery is not installed. Click the "Install GitMastery" button in the config section to install via Homebrew.';
        }

        if (output.textContent) {
          output.textContent += '\n\n' + errorText;
        } else {
          output.textContent = errorText;
        }
      }
    }

    // Update the entry styling based on success/failure
    entryDiv.className = `history-entry ${result.success ? 'success' : 'error'}`;

    // Re-enable button
    button.classList.remove('loading');
    button.disabled = false;

    // Cleanup listeners
    cleanupOutput();
    cleanupComplete();
  });

  try {
    // Start the command execution with current working directory
    await window.electronAPI.executeCommand(command, currentWorkingDirectory);
  } catch (error) {
    // Handle execution errors
    const currentOutput = output as HTMLPreElement | null;
    const errorResult: CommandResult = {
      success: false,
      output: currentOutput?.textContent || '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    entry.result = errorResult;
    entryDiv.className = 'history-entry error';

    // Remove inline spinner from command header
    inlineSpinner.remove();

    // If loading container is still showing, replace it with error output
    if (!hasReceivedOutput) {
      loadingContainer.remove();

      output = document.createElement('pre');
      output.className = 'entry-output error';
      output.textContent = errorResult.error || 'Unknown error';
      entryDiv.appendChild(output);
    } else if (currentOutput) {
      currentOutput.className = 'entry-output error';
      currentOutput.textContent += '\n\n' + (errorResult.error || 'Unknown error');
    }

    // Re-enable button
    button.classList.remove('loading');
    button.disabled = false;

    // Cleanup listeners
    cleanupOutput();
    cleanupComplete();
  }
}

// Execute command with input (for interactive commands like setup)
async function executeCommandWithInput(command: string, input: string, button: HTMLButtonElement): Promise<void> {
  // Use the same streaming logic as executeCommand
  await executeCommand(`${command}:${input}`, button);
}


// Modal elements
const modal = document.getElementById('inputModal') as HTMLDivElement;
const modalTitle = document.getElementById('modalTitle') as HTMLHeadingElement;
const modalPrompt = document.getElementById('modalPrompt') as HTMLParagraphElement;
const modalInput = document.getElementById('modalInput') as HTMLInputElement;
const modalSubmit = document.getElementById('modalSubmit') as HTMLButtonElement;
const modalCancel = document.getElementById('modalCancel') as HTMLButtonElement;

// Exercise modal elements
const exerciseModal = document.getElementById('exerciseModal') as HTMLDivElement;
const exerciseSelect = document.getElementById('exerciseSelect') as HTMLSelectElement;
const exerciseDownload = document.getElementById('exerciseDownload') as HTMLButtonElement;
const exerciseCancel = document.getElementById('exerciseCancel') as HTMLButtonElement;

// Show modal and return promise with user input
function showInputModal(title: string, prompt: string, defaultValue: string = ''): Promise<string | null> {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalPrompt.textContent = prompt;
    modalInput.value = defaultValue;
    modal.classList.add('show');
    modalInput.focus();

    const handleSubmit = () => {
      const value = modalInput.value.trim();
      modal.classList.remove('show');
      cleanup();
      resolve(value || null);
    };

    const handleCancel = () => {
      modal.classList.remove('show');
      cleanup();
      resolve(null);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    const cleanup = () => {
      modalSubmit.removeEventListener('click', handleSubmit);
      modalCancel.removeEventListener('click', handleCancel);
      modalInput.removeEventListener('keypress', handleKeyPress);
    };

    modalSubmit.addEventListener('click', handleSubmit);
    modalCancel.addEventListener('click', handleCancel);
    modalInput.addEventListener('keypress', handleKeyPress);
  });
}

// Attach event listeners to all command buttons
commandButtons.forEach((button: HTMLButtonElement) => {
  button.addEventListener('click', async () => {
    const command = button.getAttribute('data-command');
    if (!command) return;

    // Check if this is the setup command which needs input
    if (command === 'gitmastery setup') {
      const directoryName = await showInputModal(
        'Git-Mastery Setup',
        'What do you want to name your exercises directory?',
        'gitmastery-exercises'
      );

      if (directoryName === null) {
        // User cancelled
        return;
      }

      // Execute setup with the provided input
      await executeCommandWithInput(command, directoryName, button);
    } else {
      // Execute normal command (handleCommand will intercept cd if needed)
      await handleCommand(command, button);
    }
  });
});



// Optional: Add keyboard shortcuts
document.addEventListener('keydown', (event: KeyboardEvent) => {
  // Ctrl/Cmd + K to clear history
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    historyContainer.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <p>No commands executed yet</p>
        <p class="hint">Click a button above to get started</p>
      </div>
    `;
    history.length = 0;
  }
});

// Download & Start button handler
downloadStartBtn.addEventListener('click', () => {
  exerciseSelect.value = '';
  exerciseModal.classList.add('show');
  exerciseSelect.focus();
});

// Exercise modal cancel handler
exerciseCancel.addEventListener('click', () => {
  exerciseModal.classList.remove('show');
});

// Exercise modal download handler
exerciseDownload.addEventListener('click', async () => {
  const selectedExercise = exerciseSelect.value;

  if (!selectedExercise) {
    alert('Please select an exercise first');
    return;
  }

  // Close the modal
  exerciseModal.classList.remove('show');

  // Execute the download command in the user's working directory
  const command = `gitmastery download ${selectedExercise}`;
  await handleCommand(command, downloadStartBtn);
});

// Verify button handler
verifyBtn.addEventListener('click', async () => {
  const command = 'gitmastery verify';
  await handleCommand(command, verifyBtn);
});


console.log('Git-Mastery Electron App initialized');
