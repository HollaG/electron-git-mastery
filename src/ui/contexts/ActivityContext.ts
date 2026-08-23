// The current "Activity" state of the application — an activity is an active
// `Exercise`. The behaviour lives in `ActivityProvider`; this module holds only
// the shape and the consumer hook.

import { createContext, useContext } from "react";
import type { Exercise } from "../../types/Exercise";

export type ActivityState = {
  currentExercise: Exercise | null;
  startExercise: (exercise: Exercise) => void;
  endActivity: () => void;
};

export const ActivityContext = createContext<ActivityState | null>(null);

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
