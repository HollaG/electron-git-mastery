// This provider handles the current "Activity" state of the application.
// -- An activity is an active `Exercise`.
// Its responsibility is to:
// 1. Keep track of the current activity
// 2. Start and end activities
// -- Communicate to the backend to set the working directory, etc.
// 3. Report verification progress and results
//
// Verification can also be triggered by the Verify button injected into the
// embedded exercise page, which talks to the main process directly. Everything
// here is therefore keyed off the exercise identifier in the stream payload
// rather than off the current activity.

import { useState, type ReactNode, useRef } from "react";
import type { Exercise } from "../../types/Exercise";
import { IconInfoCircle } from "@tabler/icons-react";
import { useElectronStream } from "../hooks/useElectronStream";
import { useLocalExercises } from "../hooks/query/useLocalExercises";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useModal } from "./ModalContext";
import { useToast, type ToastOptions } from "./ToastContext";
import { ActivityContext } from "./ActivityContext";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";

const isVerifyCommand = (cmd: string) => cmd.startsWith("verify");

const verifyNotificationId = (data: GitMasteryTaskData) =>
  `verify-${data.exerciseIdentifier ?? "exercise"}`;

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { openModal, closeModal } = useModal();
  const { showToast, updateToast } = useToast();
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

    showToast({
      title: "Could not open the exercise folder",
      message:
        result.error ??
        "Try downloading the exercise again from the exercises list.",
      tone: "danger",
      icon: <IconInfoCircle size={18} className="text-[#b42318]" />,
      autoClose: 8000,
    });
  };

  const startExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    void enterExerciseDirectory(exercise);

    if (showOnboardingExercise) {
      const modalId = openModal({
        title: "Exercise",
        size: "sm",
        children: (
          <div className="flex flex-col gap-4 text-sm text-[#333]">
            <p>
              You are about to begin doing an exercise. Work through the
              exercise in the terminal and click Verify when you think you are
              done.
            </p>

            <Checkbox ref={showOnboardingRef} label="Don't show this again" />
            <div className="flex justify-end">
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
            </div>
          </div>
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
    notification: ToastOptions & { id: string },
  ) => {
    if (openVerifyNotifications.current.delete(notification.id)) {
      updateToast(notification.id, notification);
    } else {
      showToast(notification);
    }
  };

  const _onExerciseVerifyData = (
    _originalCommand: string,
    data: GitMasteryTaskData,
  ) => {
    const id = verifyNotificationId(data);

    if (!openVerifyNotifications.current.has(id)) {
      openVerifyNotifications.current.add(id);
      showToast({
        id,
        title: "Verifying",
        message: "Verifying...",
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });
    }

    updateToast(id, { message: data.success!.message });
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
      tone: "success",
      icon: <IconInfoCircle size={18} className="text-brand-600" />,
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
        size: "sm",
        children: (
          <div className="flex flex-col gap-4 text-sm text-[#333]">
            <p>
              {correct
                ? "You successfully completed the exercise!"
                : "Your solution is not correct yet. Keep going and verify again when you are ready."}
            </p>
            {comments && <p className="text-neutral-500">{comments}</p>}
            <div className="flex justify-end">
              <Button onClick={() => closeModal(modalId)}>OK</Button>
            </div>
          </div>
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
      tone: "danger",
      icon: <IconInfoCircle size={18} className="text-[#b42318]" />,
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
