// Type definitions for the Electron API exposed via preload
interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

interface ElectronAPI {
  executeCommand: (command: string) => Promise<CommandResult>;
  selectFile: () => Promise<string | null>;
  selectFolder: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Make this file a module
export {};


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

// History array to keep track of all executed commands
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

setWorkingDirBtn.addEventListener('click', async () => {
  setWorkingDirBtn.disabled = true;
  try {
    const path = await window.electronAPI.selectFolder();
    if (path) {
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

// Clear empty state
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

// Execute command
async function executeCommand(command: string, button: HTMLButtonElement): Promise<void> {
  // Disable button and show loading state
  button.classList.add('loading');
  button.disabled = true;

  try {
    const result = await window.electronAPI.executeCommand(command);
    
    const entry: HistoryEntry = {
      command,
      result,
      timestamp: new Date(),
    };

    history.push(entry);
    addHistoryEntry(entry);
  } catch (error) {
    const errorResult: CommandResult = {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    const entry: HistoryEntry = {
      command,
      result: errorResult,
      timestamp: new Date(),
    };

    history.push(entry);
    addHistoryEntry(entry);
  } finally {
    // Re-enable button
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// Execute command with input (for interactive commands like setup)
async function executeCommandWithInput(command: string, input: string, button: HTMLButtonElement): Promise<void> {
  // Disable button and show loading state
  button.classList.add('loading');
  button.disabled = true;

  try {
    // For setup command, we'll pass the input as a parameter
    const result = await window.electronAPI.executeCommand(`${command}:${input}`);
    
    const entry: HistoryEntry = {
      command: `${command} (input: ${input})`,
      result,
      timestamp: new Date(),
    };

    history.push(entry);
    addHistoryEntry(entry);
  } catch (error) {
    const errorResult: CommandResult = {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    const entry: HistoryEntry = {
      command: `${command} (input: ${input})`,
      result: errorResult,
      timestamp: new Date(),
    };

    history.push(entry);
    addHistoryEntry(entry);
  } finally {
    // Re-enable button
    button.classList.remove('loading');
    button.disabled = false;
  }
}


// Modal elements
const modal = document.getElementById('inputModal') as HTMLDivElement;
const modalTitle = document.getElementById('modalTitle') as HTMLHeadingElement;
const modalPrompt = document.getElementById('modalPrompt') as HTMLParagraphElement;
const modalInput = document.getElementById('modalInput') as HTMLInputElement;
const modalSubmit = document.getElementById('modalSubmit') as HTMLButtonElement;
const modalCancel = document.getElementById('modalCancel') as HTMLButtonElement;

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
      // Execute normal command
      await executeCommand(command, button);
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


console.log('Git-Mastery Electron App initialized');
