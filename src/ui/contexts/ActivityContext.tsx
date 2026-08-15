// This context handles the current "Activity" state of the application.
// -- An activity is an active `Exercise`.
// The responsibility of this context is to:
// 1. Keep track of the current activity
// 2. Start and end activities
// -- Communicate to the backend to set the working directory, etc.
// 3. Track activity duration (TODO)
// 4. Verify `Exercise` correctness and handle notifications

import {
  useState,
  createContext,
  useContext,
  type ReactNode,
  useRef,
} from "react";
import type { Exercise } from "../../types/Exercise";
import { useLocalStorage } from "@mantine/hooks";
import { useElectronModals } from "../hooks/useElectronModals";
import { Button, Checkbox, Flex, Stack, Text } from "@mantine/core";
import { formatExerciseTitle } from "../utils/format";
import { showNotification, updateNotification } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import { useElectronStream } from "../hooks/useElectronStream";
import { useLocalExercises } from "../hooks/query/useLocalExercises";

type ActivityState = {
  currentExercise: Exercise | null;
  isDoingActivity: boolean;
  startExercise: (exercise: Exercise) => void;
  endExercise: () => void;
  getActivityText: () => string;
  endActivity: () => void;
  verifyExercise: ({
    showProgress,
    callback,
  }: {
    showProgress?: boolean;
    callback?: () => void;
  }) => boolean;
};

const ActivityContext = createContext<ActivityState | null>(null);

// temporary map to track open verify notifications by id
const activeNotifications: Record<string, boolean> = {};

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { openConfirmModal, open, close } = useElectronModals();
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  const [showOnboardingExercise, setShowOnboardingExercise] = useLocalStorage({
    key: "showOnboardingExercise",
    defaultValue: true,
  });

  const showOnboardingRef = useRef<HTMLInputElement>(null);

  const { rescanDownloadedExercises } = useLocalExercises();

  const startExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);

    if (showOnboardingExercise) {
      const modalId = open({
        title: "Exercise",
        children: (
          <Stack>
            <Text>
              {" "}
              You are about to begin doing an exercise. Work through the
              exercise in the terminal and click Verify when you think you are
              done.
            </Text>

            <Checkbox ref={showOnboardingRef} label="Don't show this again" />
            <Flex justify={"end"}>
              <Button
                onClick={() => {
                  close(modalId);
                  window.electron.startExercise(exercise.identifier);
                  if (showOnboardingRef.current) {
                    setShowOnboardingExercise(
                      !showOnboardingRef.current.checked,
                    );
                  }
                }}
              >
                Start
              </Button>
            </Flex>
          </Stack>
        ),
      });
    } else {
      window.electron.startExercise(exercise.identifier);
    }
  };

  const endExercise = () => {
    setCurrentExercise(null);
  };

  const endActivity = () => {
    setCurrentExercise(null);
  };

  const getActivityText = () => {
    if (currentExercise) {
      return formatExerciseTitle(currentExercise);
    }
    return "";
  };

  const isDoingActivity = currentExercise !== null;

  const exerciseVerifyCallbackRef = useRef<() => void>(null);

  /**
   * Begins the process of verifying the current exercise.
   * Note that we should only show the notification WHEN the backend has started verifying the exercise.
   *
   * @param [showProgress=true] - Whether to show the progress toast
   * @param callback - Callback function to be called when the exercise is verified
   *
   * @returns true if exercise has began verifying, false if not
   */
  const verifyExercise = ({
    showProgress = true,
    callback = () => {},
  }: {
    showProgress?: boolean;
    callback?: () => void;
  }) => {
    if (!currentExercise) {
      return false;
    }
    void showProgress;
    exerciseVerifyCallbackRef.current = callback;
    window.electron.startGitMasteryTask(`verify ${currentExercise.identifier}`);
    return true;
  };

  const _onExerciseVerifyData = (
    originalCommand: string,
    data: GitMasteryTaskData,
  ) => {
    if (!data.exerciseIdentifier) return;
    if (!currentExercise) {
      // we cannot verify if there is no exercise selected (assume that an exercise selected --> we are cd'ed into a folder (required for verify to work))
      return;
    }
    const notificationId = `${originalCommand}-${data.exerciseIdentifier}`;

    if (!activeNotifications[notificationId]) {
      activeNotifications[notificationId] = true;
      showNotification({
        id: notificationId,
        title: "Verifying",
        message: "Verifying...",
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });
    }

    updateNotification({
      id: notificationId,
      message: data.success!.message,
    });
  };

  const _onExerciseVerifiedSuccess = (
    originalCommand: string,
    data: GitMasteryTaskData,
  ) => {
    if (!currentExercise) {
      return;
    }

    const id = `${originalCommand}-${data.exerciseIdentifier}`;
    console.log("verified success", { data });

    updateNotification({
      id,
      title: "Verification complete.",
      message: "",
      loading: false,
      color: "gm-green",
      icon: <IconInfoCircle size={18} />,
      autoClose: 5000,
      withCloseButton: true,
    });

    const { comments, incorrect, correct } =
      data.completed?.data ||
      ({} as { correct: boolean; incorrect: boolean; comments: string });

    if (correct) {
      const modalId = openConfirmModal({
        title: "Exercise completed successfully!",
        children: (
          <Stack>
            <Text> You successfully completed the exercise!</Text>
            <Text> {comments as string}</Text>
          </Stack>
        ),
        labels: {
          confirm: "OK",
          cancel: "Retry",
        },
        onCancel: () => {
          close(modalId);
        },
        onConfirm: () => close(modalId),
      });
    }

    if (incorrect) {
      const modalId = openConfirmModal({
        title: "Exercise solution incorrect!",
        children: (
          <Stack>
            <Text> Your solution is incorrect!</Text>
            <Text> {comments as string}</Text>
          </Stack>
        ),
        labels: {
          confirm: "Continue trying",
          cancel: "Reset exercise",
        },
        onCancel: () => {
          close(modalId);
        },
        onConfirm: () => close(modalId),
      });
    }

    delete activeNotifications[id];

    exerciseVerifyCallbackRef.current?.();
    exerciseVerifyCallbackRef.current = null;

    rescanDownloadedExercises();
  };

  const _onExerciseVerifiedFailure = (
    originalCommand: string,
    data: GitMasteryTaskData,
  ) => {
    const id = `${originalCommand}-${data.exerciseIdentifier}`;
    updateNotification({
      id,
      title: "Verification failed",
      message: "",
      loading: false,
      icon: <IconInfoCircle color="red" size={18} />,
      autoClose: 5000,
      withCloseButton: true,
    });

    delete activeNotifications[id];
  };
  useElectronStream({
    condition: (cmd: string) => cmd.startsWith("verify"),
    onData: _onExerciseVerifyData,
    onSuccessExit: _onExerciseVerifiedSuccess,
    onFailedExit: _onExerciseVerifiedFailure,
  });

  return (
    <ActivityContext.Provider
      value={{
        currentExercise,
        startExercise,
        endExercise,
        getActivityText,
        isDoingActivity,
        endActivity,
        verifyExercise,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

/**
 * Hook that tracks the current activity (exercise)
 */
export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}
