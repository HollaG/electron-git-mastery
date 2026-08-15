import { useState, useCallback, createContext, useContext, type ReactNode } from "react"
import type { Lesson, Tour } from "../../types/Tour"
import type { Exercise } from "../../types/Exercise";

const SITE_ORIGIN = "https://git-mastery.org"

type WebContentsViewState = {
  currentUrl: string | null;
  breadcrumbs: string[];
  setBreadcrumbs: (crumbs: string[]) => void;
  navigate: (url: string) => void;
  hide: () => void;
  show: () => void;
}

const WebContentsViewContext = createContext<WebContentsViewState | null>(null);

export function WebContentsViewProvider({ children }: { children: ReactNode }) {
  const [currentUrl, setCurrentUrl] = useState<string | null>("")
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false);

  const navigate = useCallback((url: string) => {
    setBreadcrumbs(url.replace(`${SITE_ORIGIN}/`, "").split("/"))
    setCurrentUrl(url)
    window.electron.navigate(url)

    console.log("navigate called", url)

    show();
  }, [])

  const hide = useCallback(() => {
    setIsVisible(false)
    window.electron.hide()
  }, [])

  const show = useCallback(() => {
    setIsVisible(true)
    window.electron.show()
  }, [])

  return (
    <WebContentsViewContext.Provider value={{ currentUrl, breadcrumbs, setBreadcrumbs, navigate, hide, show }
    }>
      {children}
    </WebContentsViewContext.Provider>
  )
}

/**
 * Hook that tracks the current URL displayed in the Electron WebContentsView
 * and exposes a `navigate(url)` function that updates the state and sends
 * an IPC message to tell the main process to load the new URL.
 */
export function useWebContentsView() {
  const context = useContext(WebContentsViewContext)
  if (!context) {
    throw new Error("useWebContentsView must be used within a WebContentsViewProvider")
  }
  return context;
}

export function buildLessonUrl(lesson: Lesson) {
  return `${SITE_ORIGIN}/lessons/${lesson.lesson_name}/`
}

export function buildTourHomeUrl(tour: Tour) {
  return `${SITE_ORIGIN}/lessons/trail/${tour.folder}`
}

function lessonNameForExercise(exercise: Exercise) {
  return exercise.lesson?.lesson_name ?? exercise.detour?.lesson?.lesson_name
}

export function buildExerciseUrl(exercise: Exercise) {
  const lessonName = lessonNameForExercise(exercise)
  if (!lessonName) {
    return SITE_ORIGIN
  }

  return `${SITE_ORIGIN}/lessons/${lessonName}/exercise-${exercise.identifier}`
}