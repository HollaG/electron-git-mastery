# Concurrent Command Execution

## Current Limitation

The Git-Mastery Electron app currently can only execute **one command at a time**. When a long-running command is executing, users cannot run any other commands until it completes. This is because:

1. There's only one IPC handler (`execute-command`) that processes commands sequentially
2. The IPC events (`command-output-line`, `command-complete`) don't include any command identifier
3. The renderer has no way to distinguish which output belongs to which command
4. Multiple spawned processes would send output to the same event listeners

## Proposed Solution: Command ID System

To support concurrent command execution, we need to implement a **command ID system** that tracks each command execution independently.

### Architecture Overview

```
User clicks "Help" → Generate unique ID (cmd-123)
User clicks "Version" → Generate unique ID (cmd-456)

Main Process:
  - Spawn process for cmd-123
  - Spawn process for cmd-456
  - Track both processes in a Map<commandId, ChildProcess>
  
IPC Events:
  - command-output-line: { commandId: 'cmd-123', line: '...' }
  - command-output-line: { commandId: 'cmd-456', line: '...' }
  - command-complete: { commandId: 'cmd-123', result: {...} }
  
Renderer:
  - Map command IDs to history entries
  - Route output to correct entry based on commandId
```

## Implementation Steps

### 1. Main Process Changes (`main.ts`)

**Add command tracking:**
```typescript
// Track active command processes
const activeCommands = new Map<string, ChildProcess>();

interface CommandStartEvent {
  commandId: string;
  command: string;
}

interface CommandOutputEvent {
  commandId: string;
  line: string;
}

interface CommandCompleteEvent {
  commandId: string;
  result: CommandResult;
}
```

**Modify IPC handler:**
```typescript
ipcMain.handle('execute-command', async (event, commandId: string, command: string): Promise<void> => {
  // Parse command and spawn process
  const childProcess = spawn(...);
  
  // Track the process
  activeCommands.set(commandId, childProcess);
  
  // Send output with commandId
  childProcess.stdout?.on('data', (data: Buffer) => {
    // ... parse lines ...
    lines.forEach(line => {
      event.sender.send('command-output-line', {
        commandId,
        line
      });
    });
  });
  
  // Send completion with commandId
  childProcess.on('close', (code: number | null) => {
    event.sender.send('command-complete', {
      commandId,
      result: { ... }
    });
    
    // Clean up
    activeCommands.delete(commandId);
  });
});

// Add handler to kill specific command
ipcMain.handle('kill-command', async (_event, commandId: string) => {
  const process = activeCommands.get(commandId);
  if (process) {
    process.kill();
    activeCommands.delete(commandId);
  }
});
```

### 2. Preload Script Changes (`preload.ts`)

**Update API to include command ID:**
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (commandId: string, command: string): Promise<void> => 
    ipcRenderer.invoke('execute-command', commandId, command),
    
  onCommandOutput: (callback: (data: CommandOutputEvent) => void): (() => void) => {
    const listener = (_event: any, data: CommandOutputEvent) => callback(data);
    ipcRenderer.on('command-output-line', listener);
    return () => ipcRenderer.removeListener('command-output-line', listener);
  },
  
  onCommandComplete: (callback: (data: CommandCompleteEvent) => void): (() => void) => {
    const listener = (_event: any, data: CommandCompleteEvent) => callback(data);
    ipcRenderer.on('command-complete', listener);
    return () => ipcRenderer.removeListener('command-complete', listener);
  },
  
  killCommand: (commandId: string): Promise<void> =>
    ipcRenderer.invoke('kill-command', commandId),
    
  // ... existing methods
});
```

### 3. Renderer Changes (`renderer.ts`)

**Add command tracking:**
```typescript
// Generate unique command IDs
function generateCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Track active commands
const activeCommands = new Map<string, {
  entry: HistoryEntry;
  entryDiv: HTMLDivElement;
  output: HTMLPreElement | null;
  inlineSpinner: HTMLDivElement;
  hasReceivedOutput: boolean;
}>();

// Set up global listeners once
const cleanupOutputListener = window.electronAPI.onCommandOutput((data) => {
  const commandData = activeCommands.get(data.commandId);
  if (!commandData) return;
  
  // Handle output for this specific command
  // ... (similar to current logic but using commandData)
});

const cleanupCompleteListener = window.electronAPI.onCommandComplete((data) => {
  const commandData = activeCommands.get(data.commandId);
  if (!commandData) return;
  
  // Handle completion for this specific command
  // ... (similar to current logic but using commandData)
  
  // Clean up
  activeCommands.delete(data.commandId);
});
```

**Modify executeCommand:**
```typescript
async function executeCommand(command: string, button: HTMLButtonElement): Promise<void> {
  // Generate unique ID for this command
  const commandId = generateCommandId();
  
  // Don't disable button - allow multiple commands
  button.classList.add('loading');
  
  // Create history entry
  const entry: HistoryEntry = { ... };
  const entryDiv = document.createElement('div');
  // ... create UI elements ...
  
  // Store command data
  activeCommands.set(commandId, {
    entry,
    entryDiv,
    output: null,
    inlineSpinner,
    hasReceivedOutput: false
  });
  
  try {
    // Start command with ID
    await window.electronAPI.executeCommand(commandId, command);
  } catch (error) {
    // Handle error
    activeCommands.delete(commandId);
  } finally {
    button.classList.remove('loading');
    // Don't disable button
  }
}
```

### 4. UI Enhancements

**Add kill button to running commands:**
```typescript
// Add kill button to each running command
const killButton = document.createElement('button');
killButton.className = 'kill-button';
killButton.innerHTML = '✕';
killButton.title = 'Stop command';
killButton.onclick = async () => {
  await window.electronAPI.killCommand(commandId);
  // Update UI to show command was killed
};
header.appendChild(killButton);

// Remove kill button when command completes
```

**Visual indicators:**
- Show number of running commands in UI
- Different styling for running vs completed commands
- Progress indicator for each command

### 5. Error Handling

**Handle edge cases:**
- Command killed by user
- Process crashes
- Too many concurrent commands (optional limit)
- Memory management for completed commands

## Testing Plan

1. **Concurrent Execution:**
   - Run Help and Version simultaneously
   - Verify both outputs appear in correct entries
   - Check no output mixing occurs

2. **Long-running Commands:**
   - Start Setup command
   - Run Help while Setup is running
   - Verify both complete successfully

3. **Kill Functionality:**
   - Start long-running command
   - Kill it mid-execution
   - Verify cleanup happens correctly

4. **Stress Test:**
   - Run 5+ commands simultaneously
   - Check for memory leaks
   - Verify performance remains acceptable

## Benefits

- **Better UX:** Users can run multiple commands without waiting
- **Productivity:** No blocking on long-running operations
- **Flexibility:** Can compare outputs of different commands side-by-side
- **Control:** Can kill individual commands if needed

## Considerations

- **Memory:** More concurrent commands = more memory usage
- **UI Clutter:** Many running commands might clutter the history
- **Complexity:** More complex state management in renderer
- **Process Limits:** OS limits on number of child processes

---

## Implementation Instructions

When asked to implement concurrent command execution:

1. **Start with planning:**
   - Create `implementation_plan.md` outlining the changes
   - Get user approval before proceeding

2. **Implement in this order:**
   - Main process changes (command ID tracking, updated IPC)
   - Preload script updates (new API signatures)
   - Renderer changes (command tracking, global listeners)
   - UI enhancements (kill buttons, visual indicators)

3. **Test thoroughly:**
   - Build after each major change
   - Test concurrent execution
   - Verify no output mixing
   - Check memory usage

4. **Document:**
   - Update `walkthrough.md` with new architecture
   - Add comments explaining command ID system
   - Document any limitations or known issues

5. **Key files to modify:**
   - `src/main.ts` - Command tracking and IPC handlers
   - `src/preload.ts` - API updates with command IDs
   - `src/renderer.ts` - Global listeners and command tracking
   - `src/styles.css` - Kill button and running command styles
   - TypeScript interfaces for new event types
