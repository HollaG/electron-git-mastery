interface Window {
  electron: {
    spawn: (cols: number, rows: number) => void;
    write: (data: string) => void;
    onData: (callback: (data: string) => void) => () => void;
    resize: (cols: number, rows: number) => void;

    // for Web Contents View
    setContentsViewSize: (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => void;
    navigate: (url: string) => void;
    hide: () => void;
    show: () => void;
    onWcvLoading: (callback: (loading: boolean) => void) => () => void;
    onWcvUrlChanged: (callback: (url: string) => void) => () => void;

    // for configuration
    setExeLocation: (location: string) => void;
    setDataDirectory: (directory: string) => void;
    getDataDirectory: () => Promise<string | null>;
    selectFolder: () => Promise<string | null>;
    selectFile: (fileType: string) => Promise<string | null>;

    checkGit: () => Promise<boolean>;
    checkGithubCli: () => Promise<boolean>;
    downloadGitMasteryApp: () => Promise<boolean>;
    getGitMasteryVersion: () => Promise<{ version: string; latest?: string }>;
    checkExerciseFolder: () => Promise<ExerciseFolderStatus>;

    // for retrieving config settings of the backend (electron app)
    // just an array of folder names
    getDownloadedExercises: () => Promise<ProgressData>;

    // TODO: see if we can type `originalCommand`
    onGitMasteryTaskData: (
      callback: (originalCommand: string, data: GitMasteryTaskData) => void,
    ) => () => void;

    // TODO: decide whether this command should return when (1) task starts or (2) task completes
    startGitMasteryTask: (command: string) => Promise<boolean>;
    startExercise: (exerciseIdentifier: string) => Promise<StartExerciseResult>;

    onStartExerciseResult: (
      callback: (result: StartExerciseResult) => void,
    ) => () => void;

    // for opening URLs in the system's default browser
    openExternal: (url: string) => void;

    // OpenRouter bring-your-own-key
    setOpenRouterKey: (
      key: string,
    ) => Promise<{ ok: boolean; encrypted: boolean }>;
    getOpenRouterKey: () => Promise<{
      key: string | null;
      storedEncrypted: boolean;
      encryptionAvailable: boolean;
    }>;
    hasOpenRouterKey: () => Promise<boolean>;
    clearOpenRouterKey: () => Promise<void>;
    validateOpenRouterKey: (
      key?: string,
    ) => Promise<{ ok: boolean; error?: string }>;

    // AI hints chat panel (second WebContentsView)
    chatDragBegin: () => Promise<ChatDragBeginResult>;
    chatDragEnd: (rect: ChatPanelRect) => Promise<void>;
    chatClose: () => void;
    getChatSession: () => Promise<ChatSession | null>;
    onChatSession: (callback: (session: ChatSession) => void) => () => void;

    // Carries the AI SDK's UI message stream between main and the chat view.
    // Consumed by IpcChatTransport, not by components directly.
    aiChatStart: (payload: {
      streamId: string;
      exerciseId: string;
      messages: GitMasteryUIMessage[];
    }) => Promise<AiChatStartResult>;
    aiChatAbort: (streamId: string) => void;
    onAiChatChunk: (
      callback: (streamId: string, chunk: AiChatChunk) => void,
    ) => () => void;
    onAiChatEnd: (callback: (streamId: string) => void) => () => void;
  };
}

/**
 * One-way channels (Renderer -> Main).
 * Used with ipcSend and ipcOn.
 * No response is expected.
 */
type IpcHandlerChannelMapping = {
  "pty-spawn": { cols: number; rows: number };
  "pty-write": { data: string };
  "pty-resize": { cols: number; rows: number };
  "pty-data": string;
  "wcv-navigate": { url: string };
  "wcv-show": null;
  "wcv-size": { x: number; y: number; width: number; height: number };
  "wcv-hide": null;
  "wcv-loading": { loading: boolean };
  "wcv-url-changed": { url: string };

  // to be saved on backend to run the exe if needed (Win)
  "set-exe-location": { location: string };

  // to be saved on backend to reference whenever a new exercise needs to be downloaded
  "set-data-directory": { directory: string };

  "gitmastery-task-data": { originalCommand: string; data: GitMasteryTaskData };
  "start-exercise-result": StartExerciseResult;

  // open a URL in the system default browser
  "open-external": { url: string };

  "chat-close": null;
  "chat-session": ChatSession;

  "ai-chat-abort": { streamId: string };
  "ai-chat-chunk": { streamId: string; chunk: AiChatChunk };
  "ai-chat-end": { streamId: string };
};

type IIpcInvoke<U, V> = {
  request: U;
  response: V;
};

/**
 * Two-way channels (Renderer -> Main -> Renderer).
 * Used with ipcInvoke.
 * Each entry has a typed request payload and a typed response value.
 */
type IpcInvokeChannelMapping = {
  // config
  "select-folder": IIpcInvoke<null, string | null>;
  "select-file": IIpcInvoke<string, string | null>;
  "get-data-directory": IIpcInvoke<null, string | null>;

  // setup
  "check-git": IIpcInvoke<null, boolean>;
  "check-github-cli": IIpcInvoke<null, boolean>;
  "download-gitmastery-app": IIpcInvoke<null, boolean>;
  "get-gitmastery-version": IIpcInvoke<
    null,
    { version: string; latest?: string }
  >;

  "check-exercise-folder": IIpcInvoke<null, ExerciseFolderStatus>;

  // gitmastery
  "get-downloaded-exercises": IIpcInvoke<null, ProgressData>;
  "gitmastery-setup": IIpcInvoke<null, string | null>;
  "gitmastery-start-task": IIpcInvoke<{ command: string }, boolean>;
  "gitmastery-start-exercise": IIpcInvoke<
    { exerciseIdentifier: string },
    StartExerciseResult
  >;

  "set-openrouter-key": IIpcInvoke<
    { key: string },
    { ok: boolean; encrypted: boolean }
  >;
  "get-openrouter-key": IIpcInvoke<
    null,
    {
      key: string | null;
      storedEncrypted: boolean;
      encryptionAvailable: boolean;
    }
  >;
  "has-openrouter-key": IIpcInvoke<null, boolean>;
  "clear-openrouter-key": IIpcInvoke<null, void>;
  "validate-openrouter-key": IIpcInvoke<
    { key?: string },
    { ok: boolean; error?: string }
  >;

  "chat-drag-begin": IIpcInvoke<null, ChatDragBeginResult>;
  "chat-drag-end": IIpcInvoke<ChatPanelRect, void>;
  "get-chat-session": IIpcInvoke<null, ChatSession | null>;

  "ai-chat-start": IIpcInvoke<
    { streamId: string; exerciseId: string; messages: GitMasteryUIMessage[] },
    AiChatStartResult
  >;
};

type ChatPanelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ChatDragBeginResult = {
  windowWidth: number;
  windowHeight: number;
  panel: ChatPanelRect;
};

type ChatSession = {
  exerciseId: string;
  exerciseTitle: string;
};

type AiContextBlock = {
  id: string;
  label: string;
  text: string;
};

/**
 * Conversation shape shared by main and the chat renderer. The `context` data
 * part carries what was scraped and sent for a turn, so the panel's context
 * chip is attached to the message it actually applied to.
 */
type GitMasteryUIMessage = import("ai").UIMessage<
  never,
  { context: AiContextBlock[] }
>;

type AiChatChunk = import("ai").UIMessageChunk;

type AiChatStartResult = { ok: true } | { ok: false; error: string };

/** Where exercise files live, and whether GitMastery has created that folder. */
type ExerciseFolderStatus = {
  dataDirectory: string | null;
  exercisesPath: string | null;
  ready: boolean;
};

/** Outcome of moving the terminal into an exercise's working directory. */
type StartExerciseResult = {
  ok: boolean;
  cwd?: string;
  error?: string;
  downloaded?: boolean;
  needsRestart?: boolean;
};

type GitMasteryTaskData = {
  // specific to `download` channels
  exerciseIdentifier?: string;

  // Error is sent when the terminal displays an error while running an operation.
  // In this case, the terminal is still running.
  error?: {
    code: number;
    message: string;
  };

  // Success is sent when there is a line of code written to stdout.
  // Note that the terminal is still running.
  success?: {
    message: string; // purely for FE to display at the bottom
    data: {
      stdout?: string;
      stderr?: string;
      [key: string]: unknown;
    };
  };

  // Completed is sent when the terminal exits.
  completed?: {
    status: "success" | "failure";
    message: string;
    data?: {
      [key: string]: unknown;
    };
    stdout?: string;
    stderr?: string;
  };
};

type ProgressState = "downloaded" | "in-progress" | "completed";
type ExerciseProgress = {
  status: ProgressState;
};
type ProgressData = {
  [exerciseIdentifier: string]: ExerciseProgress;
};
