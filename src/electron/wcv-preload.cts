import { contextBridge, ipcRenderer } from "electron";

/**
 * Minimal preload for the embedded git-mastery.org page.
 * Exposes a tiny IPC bridge so injected buttons can talk to the main process.
 */
contextBridge.exposeInMainWorld("wcvBridge", {
  send: (channel: string, data: Record<string, unknown>) => {
    ipcRenderer.send(channel, data);
  },
});
