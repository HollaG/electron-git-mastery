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

const isDownloadCommand = (cmd: string) => cmd.startsWith("download");

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
  // Presence of a command means its notification is already on screen; the
  // value is the tail of its output shown in that notification.
  const progressRef = useRef<Map<string, string[]>>(new Map());
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
      let lines = progressRef.current.get(originalCommand);
      if (!lines) {
        lines = [];
        progressRef.current.set(originalCommand, lines);
        showNotification({
          id: originalCommand,
          title: "Downloading",
          message: "Downloading...",
          loading: true,
          autoClose: false,
          withCloseButton: false,
        });
      }

      const exerciseIdentifier = data.exerciseIdentifier;
      if (exerciseIdentifier && !selectedExerciseRef.current) {
        selectedExerciseRef.current = resolveExercise(exerciseIdentifier);
      }

      lines.push(data.success!.message);
      if (lines.length > 4) {
        lines.shift();
      }

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
        startExercise(selectedExercise);
        setView("exercises");
        navigate(buildExerciseUrl(selectedExercise));
      }

      selectedExerciseRef.current = null;
      progressRef.current.delete(originalCommand);
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
        message:
          data.completed?.message ?? data.error?.message ?? "Download failed",
        loading: false,
        color: "red",
        icon: <IconX size={18} />,
        autoClose: 5000,
        withCloseButton: true,
      });

      selectedExerciseRef.current = null;
      progressRef.current.delete(originalCommand);
    },
    [],
  );

  useElectronStream({
    condition: isDownloadCommand,
    onData: onExerciseDownloadProgress,
    onSuccessExit: onExerciseDownloadComplete,
    onFailedExit: onExerciseDownloadFailure,
  });

  return null;
};
