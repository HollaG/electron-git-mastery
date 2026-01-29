import { contextBridge, ipcRenderer } from 'electron';

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (command: string): Promise<void> =>
    ipcRenderer.invoke('execute-command', command),
  onCommandOutput: (callback: (line: string) => void): (() => void) => {
    const listener = (_event: any, line: string) => callback(line);
    ipcRenderer.on('command-output-line', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('command-output-line', listener);
  },
  onCommandComplete: (callback: (result: CommandResult) => void): (() => void) => {
    const listener = (_event: any, result: CommandResult) => callback(result);
    ipcRenderer.on('command-complete', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('command-complete', listener);
  },
  selectFile: (): Promise<string | null> =>
    ipcRenderer.invoke('select-file'),
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('select-folder'),
  getCwd: (): Promise<string> =>
    ipcRenderer.invoke('get-cwd'),
});
