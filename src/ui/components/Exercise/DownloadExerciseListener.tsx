import { useCallback, useRef } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";
import { showNotification, updateNotification } from "@mantine/notifications";
import { useElectronStream } from "../../hooks/useElectronStream";
import { useLocalExercises } from "../../hooks/query/useLocalExercises";
import { useExercises } from "../../hooks/query/useExercises";
import { useActivity } from "../../contexts/ActivityContext";
import { useAppView } from "../../contexts/AppViewContext";
import {
  buildExerciseUrl,
  useWebContentsView,
} from "../../contexts/WebContentsViewContext";
import type { Exercise } from "../../../types/Exercise";

const activeNotifications: Record<string, boolean> = {};

/**
 * Globally mounted listener for exercise download streams.
 * Keeps progress notifications and history refresh working whether a download
 * starts from the embedded lesson page.
 */
export const DownloadExerciseListener = () => {
  const { rescanDownloadedExercises } = useLocalExercises();
  const { query: exercisesQuery } = useExercises();
  const { startExercise } = useActivity();
  const { navigate } = useWebContentsView();
  const { setView } = useAppView();
  const historyLinesRef = useRef<Record<string, string[]>>({});
  const selectedExerciseRef = useRef<Exercise | null>(null);

  const resolveExercise = useCallback(
    (exerciseIdentifier: string | undefined) => {
      if (!exerciseIdentifier) return null;
      return (
        Object.values(exercisesQuery.data || {}).find(
          (exercise) => exercise.identifier === exerciseIdentifier,
        ) || null
      );
    },
    [exercisesQuery.data],
  );

  const onExerciseDownloadProgress = useCallback(
    (originalCommand: string, data: GitMasteryTaskData) => {
      if (!activeNotifications[originalCommand]) {
        activeNotifications[originalCommand] = true;
        historyLinesRef.current[originalCommand] = [];
        showNotification({
          id: originalCommand,
          title: "Downloading",
          message: "Downloading...",
          loading: true,
          autoClose: false,
          withCloseButton: false,
        });
      }

      const message = data.success!.message;
      const exerciseIdentifier = data.exerciseIdentifier;
      if (exerciseIdentifier && !selectedExerciseRef.current) {
        selectedExerciseRef.current = resolveExercise(exerciseIdentifier);
      }

      const lines = historyLinesRef.current[originalCommand] || [];
      lines.push(message);
      if (lines.length > 4) {
        lines.shift();
      }
      historyLinesRef.current[originalCommand] = lines;

      updateNotification({
        id: originalCommand,
        message: lines.join("\n"),
      });
    },
    [resolveExercise],
  );

  const onExerciseDownloadComplete = useCallback(
    (originalCommand: string, data: GitMasteryTaskData) => {
      console.log("[info] download completed, refetching downloaded exercises");
      rescanDownloadedExercises();

      updateNotification({
        id: originalCommand,
        title: "Download complete",
        message: "",
        loading: false,
        color: "green",
        icon: <IconCheck size={18} />,
        autoClose: 5000,
        withCloseButton: true,
      });

      const selectedExercise =
        selectedExerciseRef.current || resolveExercise(data.exerciseIdentifier);

      if (selectedExercise) {
        setView("tours");
        navigate(buildExerciseUrl(selectedExercise));
        startExercise(selectedExercise);
      }

      selectedExerciseRef.current = null;
      delete historyLinesRef.current[originalCommand];
      delete activeNotifications[originalCommand];
    },
    [
      navigate,
      resolveExercise,
      rescanDownloadedExercises,
      setView,
      startExercise,
    ],
  );

  const onExerciseDownloadFailure = useCallback(
    (originalCommand: string, data: GitMasteryTaskData) => {
      console.log("[info] download completed but with errors.");

      updateNotification({
        id: originalCommand,
        title: "Download failed",
        message: data.error!.message,
        loading: false,
        color: "red",
        icon: <IconX size={18} />,
        autoClose: 5000,
        withCloseButton: true,
      });

      selectedExerciseRef.current = null;
      delete historyLinesRef.current[originalCommand];
      delete activeNotifications[originalCommand];
    },
    [],
  );

  useElectronStream({
    condition: (cmd: string) => cmd.startsWith("download"),
    onData: onExerciseDownloadProgress,
    onSuccessExit: onExerciseDownloadComplete,
    onFailedExit: onExerciseDownloadFailure,
  });

  return null;
};
