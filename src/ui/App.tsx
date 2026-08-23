import TerminalComponent from "./components/Terminal/Terminal";
import { WebsiteWrapper } from "./components/Website/WebsiteWrapper";
import { Header } from "./components/Header/Header";
import { ToursPanel } from "./components/Header/ToursMenu";
import { useEffect, useState } from "react";
import { Onboarding } from "./pages/Onboarding";
import { ExercisesPage } from "./pages/Exercises";
import { ResizeHandle } from "./components/ResizeHandle";
import { DownloadExerciseListener } from "./components/Exercise/DownloadExerciseListener";
import { ExerciseTopBar } from "./components/Exercise/ExerciseTopBar";
import { AppViewProvider } from "./contexts/AppViewProvider";
import { useAppView } from "./contexts/AppViewContext";
import { useActivity } from "./contexts/ActivityContext";
import { useWebContentsView } from "./contexts/WebContentsViewContext";
import { useLocalStorage } from "./hooks/useLocalStorage";

const MIN_MAIN = 320;
const MIN_ASIDE = 280;
const ASIDE_WIDTH_VAR = "--gm-aside-width";

function App() {
  const [onboardingCompleted, setOnboardingCompleted] = useLocalStorage({
    key: "onboarding-completed",
    defaultValue: false,
  });

  if (!onboardingCompleted)
    return (
      <Onboarding onCompleteOnboarding={() => setOnboardingCompleted(true)} />
    );

  return (
    <AppViewProvider>
      <MainApp />
    </AppViewProvider>
  );
}

function MainApp() {
  const { view } = useAppView();
  const { currentExercise } = useActivity();
  const { setEmbeddedVisible } = useWebContentsView();
  const [asideWidth, setAsideWidth] = useState(512);
  const [lessonsPanelOpened, setLessonsPanelOpened] = useState(false);
  const showExercisesCatalog = view === "exercises" && !currentExercise;
  const showEmbeddedExercise = view === "exercises" && Boolean(currentExercise);
  const showEmbedded = view === "tours" || showEmbeddedExercise;
  const showToursPanel = lessonsPanelOpened && view === "tours";

  useEffect(() => {
    setEmbeddedVisible(showEmbedded);
  }, [setEmbeddedVisible, showEmbedded]);

  // The aside reads its width from a custom property so a drag can resize the
  // pane — and with it the native view's bounds — without a React render.
  useEffect(() => {
    document.documentElement.style.setProperty(
      ASIDE_WIDTH_VAR,
      `${asideWidth}px`,
    );
  }, [asideWidth]);

  return (
    <>
      <DownloadExerciseListener />
      <div className="flex h-dvh flex-col overflow-hidden">
        <header className="relative z-[200] h-16 shrink-0 overflow-visible border-b border-neutral-200 bg-white px-4">
          <Header
            lessonsPanelOpened={lessonsPanelOpened}
            onOpenLessonsPanel={() => setLessonsPanelOpened(true)}
          />
        </header>

        <div className="flex min-h-0 min-w-0 flex-1">
          {showToursPanel && (
            <nav className="w-[300px] min-w-0 shrink-0 border-r border-neutral-200 bg-white">
              <ToursPanel onClose={() => setLessonsPanelOpened(false)} />
            </nav>
          )}

          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            {showEmbeddedExercise && <ExerciseTopBar />}
            <WebsiteWrapper />
            {showExercisesCatalog && (
              <div className="absolute inset-0 min-w-0 overflow-hidden bg-white">
                <ExercisesPage />
              </div>
            )}
          </main>

          <aside className="relative min-w-0 shrink-0 border-l border-neutral-200 w-[var(--gm-aside-width)]">
            <TerminalComponent />
            <ResizeHandle
              width={asideWidth}
              min={MIN_ASIDE}
              max={() => window.innerWidth - MIN_MAIN}
              cssVars={[ASIDE_WIDTH_VAR]}
              invert
              onChange={setAsideWidth}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

export default App;
