import {
  useState,
  useCallback,
  useRef,
  useEffect,
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
  restoreLessonPage: () => void;
  hide: () => void;
  show: () => void;
  setEmbeddedVisible: (visible: boolean) => void;
};

const WebContentsViewContext = createContext<WebContentsViewState | null>(null);

const isExerciseUrl = (url: string) => /\/exercise-/.test(url);

export function WebContentsViewProvider({ children }: { children: ReactNode }) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const embeddedVisibleRef = useRef(true);
  const lastLessonUrlRef = useRef(LESSONS_HOME_URL);

  const rememberUrl = useCallback((url: string) => {
    currentUrlRef.current = url;
    setCurrentUrl(url);
    if (!isExerciseUrl(url)) {
      lastLessonUrlRef.current = url;
    }
  }, []);

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
      if (currentUrlRef.current === url) {
        show();
        return;
      }
      rememberUrl(url);
      window.electron.navigate(url);
      console.log("navigate called", url);
      show();
    },
    [rememberUrl, show],
  );

  const restoreLessonPage = useCallback(() => {
    navigate(lastLessonUrlRef.current || LESSONS_HOME_URL);
  }, [navigate]);

  useEffect(() => {
    return window.electron.onWcvUrlChanged(rememberUrl);
  }, [rememberUrl]);

  return (
    <WebContentsViewContext.Provider
      value={{
        currentUrl,
        navigate,
        restoreLessonPage,
        hide,
        show,
        setEmbeddedVisible,
      }}
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
