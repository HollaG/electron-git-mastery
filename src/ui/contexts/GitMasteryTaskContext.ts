import { createContext, useContext } from "react";

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

export const GitMasteryTaskContext = createContext<GitMasteryTaskState | null>(
  null,
);

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
