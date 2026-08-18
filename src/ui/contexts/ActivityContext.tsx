// This context handles the current "Activity" state of the application.
// -- An activity is an active `Exercise`.
// The responsibility of this context is to:
// 1. Keep track of the current activity
// 2. Start and end activities
// -- Communicate to the backend to set the working directory, etc.
// 3. Report verification progress and results
//
// Verification can also be triggered by the Verify button injected into the
// embedded exercise page, which talks to the main process directly. Everything
// here is therefore keyed off the exercise identifier in the stream payload
// rather than off the current activity.

import {
  useState,
  createContext,
  useContext,
  type ReactNode,
  useRef,
} from "react";
import type { Exercise } from "../../types/Exercise";
import { useLocalStorage } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import { Button, Checkbox, Flex, Stack, Text } from "@mantine/core";
import {
  showNotification,
  updateNotification,
  type NotificationData,
} from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import { useElectronStream } from "../hooks/useElectronStream";
import { useLocalExercises } from "../hooks/query/useLocalExercises";

type ActivityState = {
  currentExercise: Exercise | null;
  startExercise: (exercise: Exercise) => void;
  endActivity: () => void;
};

const ActivityContext = createContext<ActivityState | null>(null);

const isVerifyCommand = (cmd: string) => cmd.startsWith("verify");

const verifyNotificationId = (data: GitMasteryTaskData) =>
  `verify-${data.exerciseIdentifier ?? "exercise"}`;

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { openModal, closeModal } = useModals();
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  const [showOnboardingExercise, setShowOnboardingExercise] = useLocalStorage({
    key: "showOnboardingExercise",
    defaultValue: true,
  });

  const showOnboardingRef = useRef<HTMLInputElement>(null);

  const { rescanDownloadedExercises } = useLocalExercises();

  /** Verify notifications currently on screen, keyed by notification id. */
  const openVerifyNotifications = useRef<Set<string>>(new Set());

  /**
   * Moves the terminal into the exercise's working directory. Verification runs
   * in whatever directory the terminal is in, so a failure here has to be
   * surfaced rather than swallowed.
   */
  const enterExerciseDirectory = async (exercise: Exercise) => {
    const result = await window.electron.startExercise(exercise.identifier);
    if (result.ok) return;

    showNotification({
      title: "Could not open the exercise folder",
      message:
        result.error ??
        "Try downloading the exercise again from the exercises list.",
      color: "red",
      icon: <IconInfoCircle size={18} />,
      autoClose: 8000,
    });
  };

  const startExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    void enterExerciseDirectory(exercise);

    if (showOnboardingExercise) {
      const modalId = openModal({
        title: "Exercise",
        children: (
          <Stack>
            <Text>
              You are about to begin doing an exercise. Work through the
              exercise in the terminal and click Verify when you think you are
              done.
            </Text>

            <Checkbox ref={showOnboardingRef} label="Don't show this again" />
            <Flex justify={"end"}>
              <Button
                onClick={() => {
                  closeModal(modalId);
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
    }
  };

  const endActivity = () => {
    setCurrentExercise(null);
  };

  /**
   * Closes off a verify notification, creating it first if the run finished
   * before any progress output arrived.
   */
  const settleVerifyNotification = (
    notification: NotificationData & { id: string },
  ) => {
    if (openVerifyNotifications.current.delete(notification.id)) {
      updateNotification(notification);
    } else {
      showNotification(notification);
    }
  };

  const _onExerciseVerifyData = (
    _originalCommand: string,
    data: GitMasteryTaskData,
  ) => {
    const id = verifyNotificationId(data);

    if (!openVerifyNotifications.current.has(id)) {
      openVerifyNotifications.current.add(id);
      showNotification({
        id,
        title: "Verifying",
        message: "Verifying...",
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });
    }

    updateNotification({ id, message: data.success!.message });
  };

  const _onExerciseVerifiedSuccess = (
    _originalCommand: string,
    data: GitMasteryTaskData,
  ) => {
    settleVerifyNotification({
      id: verifyNotificationId(data),
      title: "Verification complete.",
      message: "",
      loading: false,
      color: "gm-green",
      icon: <IconInfoCircle size={18} />,
      autoClose: 5000,
      withCloseButton: true,
    });

    const { comments, incorrect, correct } = (data.completed?.data ?? {}) as {
      correct?: boolean;
      incorrect?: boolean;
      comments?: string;
    };

    if (correct || incorrect) {
      const modalId = openModal({
        title: correct
          ? "Exercise completed successfully!"
          : "Exercise solution incorrect",
        children: (
          <Stack>
            <Text>
              {correct
                ? "You successfully completed the exercise!"
                : "Your solution is not correct yet. Keep going and verify again when you are ready."}
            </Text>
            {comments && <Text>{comments}</Text>}
            <Flex justify="end">
              <Button onClick={() => closeModal(modalId)}>OK</Button>
            </Flex>
          </Stack>
        ),
      });
    }

    rescanDownloadedExercises();
  };

  const _onExerciseVerifiedFailure = (
    _originalCommand: string,
    data: GitMasteryTaskData,
  ) => {
    settleVerifyNotification({
      id: verifyNotificationId(data),
      title: "Verification failed",
      message: data.completed?.message ?? "Please try again",
      loading: false,
      color: "red",
      icon: <IconInfoCircle size={18} />,
      autoClose: 5000,
      withCloseButton: true,
    });
  };

  useElectronStream({
    condition: isVerifyCommand,
    onData: _onExerciseVerifyData,
    onSuccessExit: _onExerciseVerifiedSuccess,
    onFailedExit: _onExerciseVerifiedFailure,
  });

  return (
    <ActivityContext.Provider
      value={{
        currentExercise,
        startExercise,
        endActivity,
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
