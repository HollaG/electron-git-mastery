import {
  useState,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useModals } from "@mantine/modals";
import type { Exercise } from "../../types/Exercise";
import type { Lesson, Tour } from "../../types/Tour";

export const SITE_ORIGIN = "https://git-mastery.org";
export const LESSONS_HOME_URL = `${SITE_ORIGIN}/lessons/`;

type WebContentsViewState = {
  navigate: (url: string) => void;
  restoreLessonPage: () => void;
  setEmbeddedVisible: (visible: boolean) => void;
  suppressEmbedded: () => () => void;
};

const WebContentsViewContext = createContext<WebContentsViewState | null>(null);

const isExerciseUrl = (url: string) => /\/exercise-/.test(url);

export function WebContentsViewProvider({ children }: { children: ReactNode }) {
  const currentUrlRef = useRef<string | null>(null);
  const lastLessonUrlRef = useRef(LESSONS_HOME_URL);

  // The WebContentsView is a native child view that always paints above the
  // React DOM, so anything rendered in the DOM (modals, full page React views)
  // is only visible while the native view is collapsed. Visibility is derived
  // from these two values alone: every caller either declares whether the
  // embedded site belongs on screen, or claims a suppression while it needs
  // the DOM on top.
  const [embeddedVisible, setEmbeddedVisible] = useState(false);
  const [suppressionCount, setSuppressionCount] = useState(0);
  const visible = embeddedVisible && suppressionCount === 0;

  useEffect(() => {
    if (visible) {
      window.electron.show();
    } else {
      window.electron.hide();
    }
  }, [visible]);

  const suppressEmbedded = useCallback(() => {
    setSuppressionCount((count) => count + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setSuppressionCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const rememberUrl = useCallback((url: string) => {
    currentUrlRef.current = url;
    if (!isExerciseUrl(url)) {
      lastLessonUrlRef.current = url;
    }
  }, []);

  const navigate = useCallback(
    (url: string) => {
      if (currentUrlRef.current === url) return;
      rememberUrl(url);
      window.electron.navigate(url);
    },
    [rememberUrl],
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
        navigate,
        restoreLessonPage,
        setEmbeddedVisible,
        suppressEmbedded,
      }}
    >
      <ModalSuppression />
      {children}
    </WebContentsViewContext.Provider>
  );
}

/**
 * Collapses the native view for as long as any Mantine modal is open, so modals
 * stay visible however they are dismissed (button, close icon, Escape, click
 * outside).
 */
function ModalSuppression() {
  const { modals } = useModals();
  const { suppressEmbedded } = useWebContentsView();
  const hasOpenModal = modals.length > 0;

  useEffect(() => {
    if (!hasOpenModal) return;
    return suppressEmbedded();
  }, [hasOpenModal, suppressEmbedded]);

  return null;
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
