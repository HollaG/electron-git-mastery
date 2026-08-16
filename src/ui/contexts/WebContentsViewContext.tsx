import {
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { Exercise } from "../../types/Exercise";
import type { Lesson, Tour } from "../../types/Tour";

export const SITE_ORIGIN = "https://git-mastery.org";
export const LESSONS_HOME_URL = `${SITE_ORIGIN}/lessons/`;

type WebContentsViewState = {
  currentUrl: string | null;
  navigate: (url: string) => void;
  hide: () => void;
  show: () => void;
  setEmbeddedVisible: (visible: boolean) => void;
};

const WebContentsViewContext = createContext<WebContentsViewState | null>(null);

export function WebContentsViewProvider({ children }: { children: ReactNode }) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const embeddedVisibleRef = useRef(true);

  const hide = useCallback(() => {
    window.electron.hide();
  }, []);

  const show = useCallback(() => {
    if (embeddedVisibleRef.current) {
      window.electron.show();
    }
  }, []);

  const setEmbeddedVisible = useCallback((visible: boolean) => {
    embeddedVisibleRef.current = visible;
    if (visible) {
      window.electron.show();
    } else {
      window.electron.hide();
    }
  }, []);

  const navigate = useCallback(
    (url: string) => {
      setCurrentUrl(url);
      window.electron.navigate(url);
      console.log("navigate called", url);
      show();
    },
    [show],
  );

  return (
    <WebContentsViewContext.Provider
      value={{ currentUrl, navigate, hide, show, setEmbeddedVisible }}
    >
      {children}
    </WebContentsViewContext.Provider>
  );
}

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
  return `${SITE_ORIGIN}/lessons/trail/${tour.folder}`;
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
