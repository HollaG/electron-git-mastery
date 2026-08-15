import { dialog, BrowserWindow } from "electron";
import { getConfig, getUserStoragePath, saveConfig } from "../storage.js";
import { ipcMainHandle, ipcMainOn } from "../utils/util.js";
import { getExerciseDirectory } from "../utils/cli/getters.js";
import fs from "fs";
import path from "path";

function readProgressData(): ProgressData {
  const progressFilePath = path.join(getUserStoragePath(), "progressData.json");
  if (!fs.existsSync(progressFilePath)) {
    return {};
  }

  try {
    const rawData = fs.readFileSync(progressFilePath, "utf8");
    return JSON.parse(rawData) as ProgressData;
  } catch (err) {
    console.error("[error] failed to parse progress data: ", err);
    return {};
  }
}

export function setupConfigIpc(mainWindow: BrowserWindow) {
  ipcMainHandle("select-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMainHandle("select-file", async (fileType: string) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [{ name: fileType, extensions: [fileType] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMainOn("set-data-directory", ({ directory }) => {
    console.log("[info] set-data-directory event: ", directory);
    saveConfig({ dataDirectory: directory });
  });

  ipcMainHandle("get-data-directory", async () => {
    return getConfig().dataDirectory || null;
  });

  ipcMainHandle("get-downloaded-exercises", async () => {
    const exerciseDirectory = getExerciseDirectory();
    if (!fs.existsSync(exerciseDirectory)) {
      return {};
    }

    const progressData = readProgressData();

    // Prefer folders that actually exist on disk, merging in progress status.
    const exerciseFolders = fs
      .readdirSync(exerciseDirectory)
      .filter((file) => {
        return fs.statSync(path.join(exerciseDirectory, file)).isDirectory();
      })
      .filter((exercise) => exercise !== "progress");

    const downloaded: ProgressData = {};
    for (const exerciseId of exerciseFolders) {
      downloaded[exerciseId] = progressData[exerciseId] || {
        status: "not-started",
      };
    }

    // Keep any progress entries that may not have a folder yet (e.g. mid-download).
    for (const [exerciseId, progress] of Object.entries(progressData)) {
      if (!downloaded[exerciseId]) {
        downloaded[exerciseId] = progress;
      }
    }

    console.log("[info] get-downloaded-exercises event: ", exerciseFolders);
    return downloaded;
  });
}
