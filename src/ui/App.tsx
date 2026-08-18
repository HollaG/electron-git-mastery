import { AppShell, Box } from "@mantine/core";
import TerminalComponent from "./components/Terminal/Terminal";
import { WebsiteWrapper } from "./components/Website/WebsiteWrapper";
import { Header } from "./components/Header/Header";
import { ToursPanel } from "./components/Header/ToursMenu";
import { useEffect, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { Onboarding } from "./pages/Onboarding";
import { ExercisesPage } from "./pages/Exercises";
import { ResizeHandle } from "./components/ResizeHandle";
import { DownloadExerciseListener } from "./components/Exercise/DownloadExerciseListener";
import { ExerciseTopBar } from "./components/Exercise/ExerciseTopBar";
import { AppViewProvider, useAppView } from "./contexts/AppViewContext";
import { useActivity } from "./contexts/ActivityContext";
import { useWebContentsView } from "./contexts/WebContentsViewContext";

const MIN_MAIN = 320;
const MIN_ASIDE = 280;
const HEADER_HEIGHT = 64;

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

  useEffect(() => {
    setEmbeddedVisible(showEmbedded);
  }, [setEmbeddedVisible, showEmbedded]);

  return (
    <>
      <DownloadExerciseListener />
      <AppShell
        padding={0}
        transitionDuration={0}
        header={{ height: HEADER_HEIGHT }}
        navbar={{
          width: 300,
          breakpoint: "xs",
          collapsed: {
            desktop: !lessonsPanelOpened || view !== "tours",
            mobile: !lessonsPanelOpened || view !== "tours",
          },
        }}
        aside={{ width: asideWidth, breakpoint: "xs" }}
      >
        <AppShell.Header
          bg="white"
          style={{ overflow: "visible", zIndex: 200 }}
        >
          <Header
            lessonsPanelOpened={lessonsPanelOpened}
            onToggleLessonsPanel={() =>
              setLessonsPanelOpened((opened) => !opened)
            }
          />
        </AppShell.Header>
        <AppShell.Navbar>
          <ToursPanel onMinimize={() => setLessonsPanelOpened(false)} />
        </AppShell.Navbar>
        <AppShell.Main className="flex h-dvh flex-col overflow-hidden">
          <Box pos="relative" className="flex min-h-0 min-w-0 flex-1 flex-col">
            {showEmbeddedExercise && <ExerciseTopBar />}
            <WebsiteWrapper />
            {showExercisesCatalog && (
              <Box
                pos="absolute"
                inset={0}
                bg="white"
                className="min-w-0 overflow-hidden"
              >
                <ExercisesPage />
              </Box>
            )}
          </Box>
        </AppShell.Main>
        <AppShell.Aside>
          <Box pos="relative" h="100%">
            <TerminalComponent />
            <ResizeHandle
              width={asideWidth}
              min={MIN_ASIDE}
              max={() => window.innerWidth - MIN_MAIN}
              cssVars={["--app-shell-aside-width", "--app-shell-aside-offset"]}
              invert
              onChange={setAsideWidth}
            />
          </Box>
        </AppShell.Aside>
      </AppShell>
    </>
  );
}

export default App;
