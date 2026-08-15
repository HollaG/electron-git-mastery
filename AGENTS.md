# Development requirements

You are developing as part of a 6-month university course. As such, many developers over the course of years will touch this code. Each time you make a change, you must update the documentation to reflect the change. If documentation does not exist, add it in `/docs`.

## Electron Build Boundary Rule

**Never import files from outside `src/electron/` in any file inside `src/electron/`** (including `preload.cts`, `main.ts`, and files in `ipc/`).

The electron TypeScript config (`src/electron/tsconfig.json`) only covers `src/electron/**`. When a file inside `src/electron/` imports from a sibling directory (e.g. `../../shared/constants.js`), TypeScript recalculates the implicit `rootDir` to be the common ancestor (`src/`). This causes all compiled output to be nested one level deeper (e.g. `dist-electron/electron/main.js` instead of `dist-electron/main.js`), which breaks Electron startup since `package.json` expects `dist-electron/main.js`.

**The fix:** Inline any shared constants or utilities directly inside `src/electron/`. Do not create cross-directory imports from within `src/electron/`.

IPC and task payload types are shared via the ambient `types.d.ts` at the repo root (referenced from both `tsconfig.app.json` and `src/electron/tsconfig.json`). Catalog types under `src/types/` are renderer-only. If you need a shared constant or utility in both processes, duplicate it — do not create a shared import.

---

## Commands

```bash
npm run dev                 # React dev server (port 5123) + Electron main in parallel
npm run build               # Compile TypeScript + bundle React (required before dist)
npm run lint                # ESLint (flat config, TypeScript plugin)
npm run format              # Prettier --write (see .prettierrc.json)

npm run transpile:electron  # Compile only the Electron main process

npm run dist:mac            # Package for macOS arm64
npm run dist:win            # Package for Windows x64
npm run dist:linux          # Package for Linux x64
```

There is no test suite.

After building a macOS `.dmg`, unsigned builds require removing quarantine flags:

```bash
xattr -rc /Applications/git-mastery.app
```

See `docs/development/scripts.md` for script details and `docs/development/packaging.md` for icons and electron-builder layout.

---

## Architecture

Git-Mastery Desktop is an Electron app that provides an interactive learning environment for Git exercises from git-mastery.org. It embeds an xterm.js terminal (backed by node-pty) and a sandboxed WebContentsView that loads the git-mastery.org web app.

Linux support is still in development.

### Process model

**Main process** (`src/electron/`): Manages the BrowserWindow, spawns the PTY shell, runs the `gitmastery` CLI as child processes, persists config/progress to JSON files in Electron's `userData`, and registers all IPC handlers.

Entry point is `src/electron/main.ts`. On `app.ready` it creates the window and registers:

| Module | File | Responsibility |
| ------ | ---- | -------------- |
| Terminal PTY | `src/electron/ipc/terminal.ts` | Spawn/write/resize the shell (Git Bash on Windows when available) |
| GitMastery CLI | `src/electron/ipc/gitmastery.ts` | `setup` / `download` / `verify`, progress file, `startExercise` cwd |
| WebContentsView | `src/electron/ipc/webContentsView.ts` | Embedded git-mastery.org view, injected download/verify buttons |
| Config | `src/electron/ipc/config.ts` | Data directory, folder/file dialogs, downloaded-exercise progress |
| Prerequisites | `src/electron/ipc/setupPrereq.ts` | Git / GitHub CLI checks, CLI install, version, `openExternal` |

**Renderer process** (`src/ui/`): React 19 + Mantine v8 + TanStack Query app that loads from `http://localhost:5123` in dev or `dist-react/` in prod. Communicates with the main process exclusively via the context bridge exposed as `window.electron`.

Root providers live in `src/ui/main.tsx` (`GitMasteryTaskProvider`, `WebContentsViewProvider`, `ActivityProvider`). `src/ui/App.tsx` gates onboarding vs the main `AppShell` (header, left nav, website pane, terminal aside).

**Styling**: Mantine components/props plus TailwindCSS v4 utility classes. Tailwind is configured CSS-first (no `tailwind.config.js`) via the `@tailwindcss/postcss` plugin in `postcss.config.cjs`. The entry stylesheet `src/ui/index.css` declares the cascade order `@layer theme, base, mantine, components, utilities;`, and `main.tsx` imports Mantine's `*.layer.css` variants so Tailwind's preflight reset never overrides Mantine. Prefer Tailwind `className` over inline `style={{}}` for layout; keep Mantine props (`bg`/`p`/`w`/`h`/`styles`). See `docs/development/styling.md`.

**Context bridge** (`src/electron/preload.cts`): Typed API wrapping all IPC channels. The renderer never calls `ipcRenderer` directly. Handler types live in root `types.d.ts` and are referenced from `src/ui/` via `window.electron.*`.

**WebContentsView** (`src/electron/ipc/webContentsView.ts`): Separate sandboxed view (not the main BrowserWindow) for displaying git-mastery.org. Has its own preload (`wcv-preload.cts`) exposing `window.wcvBridge.send`. Injected JS replaces site download/verify placeholders with IPC-driven buttons (`wcv-start-exercise`, `wcv-verify-exercise`). The renderer controls position/size via `window.electron.setContentsViewSize(x, y, w, h)`. Lesson/exercise page URLs are built from catalog `lesson_name` fields (not a `path` field) in `src/ui/context/useWebContentsView.tsx`. See `docs/development/website-urls.md`.

### IPC patterns

Three communication patterns are used throughout:

- **Request-response** (`ipcMainHandle` / `ipcRenderer.invoke`): async, returns a Promise. Used for config reads, file dialogs, prerequisite checks, `gitmastery-start-task`.
- **Fire-and-forget** (`ipcMainOn` / `ipcRenderer.send`): one-way from renderer to main. Used for PTY writes, navigation, resizing, `gitmastery-start-exercise`.
- **Streaming subscriptions** (`mainWindow.webContents.send` / `ipcRenderer.on`): main pushes data to renderer. Used for PTY output (`pty-data`) and `gitmastery-task-data`.

All IPC handlers validate the sender frame URL (localhost:5123 in dev or the signed app file URL in prod) — see `src/electron/utils/util.ts`.

### GitMastery task streaming

Running a `gitmastery` command (`setup`, `download <id>`, `verify`) streams structured payloads over `gitmastery-task-data`. Dispatch is `window.electron.startGitMasteryTask(command)` → `gitmastery-start-task` in `src/electron/ipc/gitmastery.ts`. Completion is **not** the invoke return value (`true` means dispatched); consumers wait on the stream.

```typescript
{
  originalCommand: string  // e.g. "setup", "download intro-to-git", "verify"
  data: GitMasteryTaskData
}
```

`GitMasteryTaskData` (`types.d.ts`):

- `success` — intermediate stdout chunk (process still running)
- `error` — intermediate stderr / failure message (`code`, `message`)
- `completed` — process exited (`status: "success" | "failure"`)
- `exerciseIdentifier` — set on download payloads

`GitMasteryTaskContext` (`src/ui/contexts/GitMasteryTaskContext.tsx`) is the single IPC listener for this channel. Components register condition-based callbacks via `useElectronStream` — they receive data only when their filter matches. This decouples streaming from consumers without re-broadcasting via state.

CLI spawn details, platform PATH handling, and why `shell: true` is forbidden: `docs/electron/EXECUTING-GITMASTERY-COMMANDS.md`.

### CLI resolution

`getGitMasteryExecutable()` in `src/electron/utils/cli/getters.ts`:

| Platform | Binary | How it is installed |
| -------- | ------ | ------------------- |
| `darwin` | `gitmastery` on PATH | Homebrew (`brew tap git-mastery/gitmastery`, then upgrade/install) |
| `win32` | `<dataDirectory>/gitmastery.exe` | GitHub Releases asset `gitmastery.exe` |
| `linux` | `<dataDirectory>/gitmastery` | GitHub Releases asset `gitmastery` (still in development) |

Onboarding calls `downloadGitMasteryApp` (`src/electron/ipc/setupPrereq.ts`), which delegates to `utils/darwin/downloadApp.ts`, `utils/win32/downloadExe.ts`, or `utils/linux/downloadApp.ts`. macOS prepends Homebrew paths via `getEnvironmentWithHomebrew()` before spawning.

Exercises live under `<dataDirectory>/gitmastery-exercises/`. `gitmastery-start-exercise` cds the PTY into the resolved exercise working directory (flat repo, nested clone, or `<id>-repo`).

### Catalogs and activity

Public catalogs (fetched in the renderer):

| Catalog | URL | Types |
| ------- | --- | ----- |
| Lessons / tours | `https://git-mastery.org/lessons/lessons.json` | `src/types/Tour.ts` (`tour_name`, `lesson_name`) |
| Exercises | `https://git-mastery.org/exercises-directory/exercises.json` | `src/types/Exercise.ts` (`identifier`, optional `lesson` / `detour`) |

`ActivityProvider` (`src/ui/context/useActivity.tsx`) tracks the current lesson or exercise, starts/ends work, triggers verify, and shows notifications from the task stream.

### State and persistence

- **App config** (`src/electron/storage.ts`): JSON in `userData/config.json`. Stores `dataDirectory` (where exercises are cloned).
- **Exercise progress** (`src/electron/ipc/gitmastery.ts`): JSON in `userData/progressData.json`. Tracks per-exercise status: `not-started → in-progress → correct|incorrect`.
- **Onboarding gate**: `localStorage` key `onboarding-completed` (`src/ui/App.tsx`). The stepper in `src/ui/pages/Onboarding.tsx` checks Git and GitHub CLI, chooses a data directory, and installs the GitMastery CLI before the main app renders.

### TypeScript config layout

The project uses TypeScript project references (composite mode):

| Config | Targets | Notes |
| ------ | ------- | ----- |
| `tsconfig.json` | Root, references all others | |
| `tsconfig.app.json` | `src/` except `src/electron/` | Bundler module mode, no emit |
| `tsconfig.node.json` | Vite config | |
| `src/electron/tsconfig.json` | `src/electron/` only | NodeNext module, emits to `dist-electron/` |

This is why `src/electron/` has its own `tsconfig.json` and why catalog types under `src/types/` are only imported from `src/ui/`.
