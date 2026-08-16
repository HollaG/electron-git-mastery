import { AppShell, Box } from "@mantine/core";
import TerminalComponent from "./components/Terminal/Terminal";
import { WebsiteWrapper } from "./components/Website/WebsiteWrapper";
import { Header } from "./components/Header/Header";
import { useEffect, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { Onboarding } from "./pages/Onboarding";
import { ExercisesPage } from "./pages/Exercises";
import { ResizeHandle } from "./components/ResizeHandle";
import { DownloadExerciseListener } from "./components/Exercise/DownloadExerciseListener";
import { AppViewProvider, useAppView } from "./contexts/AppViewContext";
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
  const { setEmbeddedVisible } = useWebContentsView();
  const [asideWidth, setAsideWidth] = useState(512);

  useEffect(() => {
    setEmbeddedVisible(view === "tours");
  }, [setEmbeddedVisible, view]);

  const asideMax = window.innerWidth - MIN_MAIN;

  return (
    <>
      <DownloadExerciseListener />
      <AppShell
        padding={0}
        transitionDuration={0}
        header={{ height: HEADER_HEIGHT }}
        aside={{ width: asideWidth, breakpoint: "xs" }}
      >
        <AppShell.Header
          bg="white"
          style={{ overflow: "visible", zIndex: 200 }}
        >
          <Header />
        </AppShell.Header>
        <AppShell.Main className="flex h-dvh flex-col overflow-hidden">
          <Box pos="relative" className="flex min-h-0 min-w-0 flex-1 flex-col">
            <WebsiteWrapper />
            {view === "exercises" && (
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
              max={asideMax}
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
