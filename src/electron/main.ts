import { app, BrowserWindow } from "electron";
import path from "path";
import { isDev } from "./utils/util.js";
import { getPreloadPath } from "./pathResolver.js";
import { setupTerminalIpc } from "./ipc/terminal.js";
import { setupGitmasteryIpc } from "./ipc/gitmastery.js";
import { setupWebContentsViewIpc } from "./ipc/webContentsView.js";
import { setupConfigIpc } from "./ipc/config.js";
import { setupPrereqIpc } from "./ipc/setupPrereq.js";
import { setupChatViewIpc } from "./ipc/chatView.js";
import { setupAiIpc } from "./ipc/ai.js";
import { prefetchCurriculum } from "./ai/curriculum.js";

let mainWindow: BrowserWindow | null = null;

export function getMainWindow() {
  if (!mainWindow) {
    throw new Error("Main window not found");
  }
  return mainWindow;
}

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    minWidth: 1024,
    minHeight: 680,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  setupTerminalIpc(mainWindow);
  setupGitmasteryIpc(mainWindow);
  setupWebContentsViewIpc(mainWindow);
  setupConfigIpc(mainWindow);
  setupPrereqIpc();
  setupChatViewIpc(mainWindow);
  setupAiIpc();

  // Warmed once at startup so the AI context path never awaits the network.
  prefetchCurriculum();

  console.log("isDev: ", isDev());
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
});
