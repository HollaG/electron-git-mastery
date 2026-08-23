import { BrowserWindow } from "electron";

export const sendToRenderer = (
  mainWindow: BrowserWindow,
  channel: string,
  data: unknown,
) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
};
