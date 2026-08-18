import { useEffect, useRef } from "react";
import { useGitMasteryTask } from "../contexts/GitMasteryTaskContext";

type StreamHandler = (
  originalCommand: string,
  data: GitMasteryTaskData,
) => void;

/**
 * Subscribes to the GitMastery task stream and splits it into progress,
 * success and failure callbacks.
 */
export const useElectronStream = (handlers: {
  condition: (cmd: string) => boolean;
  onData: StreamHandler;
  onSuccessExit: StreamHandler;
  onFailedExit: StreamHandler;
}) => {
  const { addListener } = useGitMasteryTask();

  // Callers routinely pass freshly created closures, so the handlers are kept in
  // a ref to subscribe once instead of on every render.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    return addListener(
      (command) => handlersRef.current.condition(command),
      (originalCommand, data) => {
        const { onData, onSuccessExit, onFailedExit } = handlersRef.current;

        if (data.completed?.status === "success") {
          onSuccessExit(originalCommand, data);
        } else if (data.completed?.status === "failure") {
          onFailedExit(originalCommand, data);
        } else if (data.success) {
          onData(originalCommand, data);
        }
      },
    );
  }, [addListener]);
};
