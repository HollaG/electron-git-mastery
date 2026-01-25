import { contextBridge, ipcRenderer } from 'electron';

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (command: string): Promise<CommandResult> => 
    ipcRenderer.invoke('execute-command', command),
  selectFile: (): Promise<string | null> =>
    ipcRenderer.invoke('select-file'),
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('select-folder'),
  getCwd: (): Promise<string> =>
    ipcRenderer.invoke('get-cwd'),
});
