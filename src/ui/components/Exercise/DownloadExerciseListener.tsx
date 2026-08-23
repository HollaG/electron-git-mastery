import { useCallback, useRef } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useElectronStream } from "../../hooks/useElectronStream";
import { useToast } from "../../contexts/ToastContext";
import { useLocalExercises } from "../../hooks/query/useLocalExercises";
import { useExercises } from "../../hooks/query/useExercises";
import { useActivity } from "../../contexts/ActivityContext";
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
  const { showToast, updateToast } = useToast();
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
        showToast({
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

      updateToast(originalCommand, { message: lines.join("\n") });
    },
    [resolveExercise, showToast, updateToast],
  );

  const onExerciseDownloadComplete = useCallback(
    (originalCommand: string, data: GitMasteryTaskData) => {
      console.log("[info] download completed, refetching downloaded exercises");
      rescanDownloadedExercises();

      updateToast(originalCommand, {
        title: "Download complete",
        message: "",
        loading: false,
        tone: "success",
        icon: <IconCheck size={18} className="text-brand-600" />,
        autoClose: 5000,
        withCloseButton: true,
      });

      const selectedExercise =
        resolveExercise(data.exerciseIdentifier) ?? selectedExerciseRef.current;

      if (selectedExercise) {
        startExercise(selectedExercise);
        navigate(buildExerciseUrl(selectedExercise));
      }

      if (
        selectedExerciseRef.current?.identifier === selectedExercise?.identifier
      ) {
        selectedExerciseRef.current = null;
      }
      progressRef.current.delete(originalCommand);
    },
    [
      navigate,
      resolveExercise,
      rescanDownloadedExercises,
      startExercise,
      updateToast,
    ],
  );

  const onExerciseDownloadFailure = useCallback(
    (originalCommand: string, data: GitMasteryTaskData) => {
      console.log("[info] download completed but with errors.");

      updateToast(originalCommand, {
        title: "Download failed",
        message:
          data.completed?.message ?? data.error?.message ?? "Download failed",
        loading: false,
        tone: "danger",
        icon: <IconX size={18} className="text-[#b42318]" />,
        autoClose: 5000,
        withCloseButton: true,
      });

      const failedExercise = resolveExercise(data.exerciseIdentifier);
      if (
        failedExercise &&
        selectedExerciseRef.current?.identifier === failedExercise.identifier
      ) {
        selectedExerciseRef.current = null;
      }
      progressRef.current.delete(originalCommand);
    },
    [resolveExercise, updateToast],
  );

  useElectronStream({
    condition: isDownloadCommand,
    onData: onExerciseDownloadProgress,
    onSuccessExit: onExerciseDownloadComplete,
    onFailedExit: onExerciseDownloadFailure,
  });

  return null;
};
