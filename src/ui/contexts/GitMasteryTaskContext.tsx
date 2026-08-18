import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { ReactNode } from "react";

export type GitMasteryTaskListener = {
  condition: (command: string) => boolean;
  callback: (command: string, data: GitMasteryTaskData) => void;
};

export type GitMasteryTaskState = {
  /** Register a callback for incoming task data. Returns an unsubscribe function. */
  addListener: (
    condition: (command: string) => boolean,
    callback: (command: string, data: GitMasteryTaskData) => void,
  ) => () => void;
};

const GitMasteryTaskContext = createContext<GitMasteryTaskState | null>(null);

/**
 * Mount this provider once near the root of the tree.
 * It registers a single IPC listener for `onGitMasteryTaskData` and
 * distributes the results to any number of consumers via context.
 *
 * Messages are handed straight to the listeners rather than stored in state, so
 * a chatty task does not re-render every consumer on every line of output.
 */
export function GitMasteryTaskProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef<Set<GitMasteryTaskListener>>(new Set());

  const addListener = useCallback(
    (
      condition: (command: string) => boolean,
      callback: (command: string, data: GitMasteryTaskData) => void,
    ) => {
      const listener = { condition, callback };
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    [],
  );

  useEffect(() => {
    return window.electron.onGitMasteryTaskData((originalCommand, taskData) => {
      listenersRef.current.forEach((listener) => {
        if (listener.condition(originalCommand)) {
          listener.callback(originalCommand, taskData);
        }
      });
    });
  }, []);

  return (
    <GitMasteryTaskContext.Provider value={{ addListener }}>
      {children}
    </GitMasteryTaskContext.Provider>
  );
}

/**
 * Consume GitMastery task state from any component inside the provider.
 *
 * @example
 *   const { addListener } = useGitMasteryTask();
 */
export function useGitMasteryTask(): GitMasteryTaskState {
  const ctx = useContext(GitMasteryTaskContext);
  if (!ctx) {
    throw new Error(
      "useGitMasteryTask must be used inside <GitMasteryTaskProvider>",
    );
  }
  return ctx;
}
