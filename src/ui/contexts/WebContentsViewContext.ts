import { createContext, useContext } from "react";
import type { Exercise } from "../../types/Exercise";
import type { Lesson, Tour } from "../../types/Tour";

export const SITE_ORIGIN = "https://git-mastery.org";
export const LESSONS_HOME_URL = `${SITE_ORIGIN}/lessons/`;

export type WebContentsViewState = {
  navigate: (url: string) => void;
  restoreLessonPage: () => void;
  setEmbeddedVisible: (visible: boolean) => void;
  suppressEmbedded: () => () => void;
};

export const WebContentsViewContext =
  createContext<WebContentsViewState | null>(null);

/**
 * Hook that tracks the current URL displayed in the Electron WebContentsView
 * and exposes a `navigate(url)` function that updates the state and sends
 * an IPC message to tell the main process to load the new URL.
 */
export function useWebContentsView() {
  const context = useContext(WebContentsViewContext);
  if (!context) {
    throw new Error(
      "useWebContentsView must be used within a WebContentsViewProvider",
    );
  }
  return context;
}

export function buildLessonUrl(lesson: Lesson) {
  return `${SITE_ORIGIN}/lessons/${lesson.lesson_name}/`;
}

export function buildTourHomeUrl(tour: Tour) {
  return buildTourHomeUrlFromName(tour.folder);
}

export function buildTourHomeUrlFromName(tourName: string) {
  return `${SITE_ORIGIN}/lessons/trail/${tourName}`;
}

function lessonNameForExercise(exercise: Exercise) {
  return exercise.lesson?.lesson_name ?? exercise.detour?.lesson?.lesson_name;
}

export function buildExerciseUrl(exercise: Exercise) {
  const lessonName = lessonNameForExercise(exercise);
  if (!lessonName) {
    return SITE_ORIGIN;
  }

  return `${SITE_ORIGIN}/lessons/${lessonName}/exercise-${exercise.identifier}`;
}
