import { AppShell, Box } from "@mantine/core";
import TerminalComponent from "./components/Terminal/Terminal";
import { WebsiteWrapper } from "./components/Website/WebsiteWrapper";
import { Header } from "./components/Header/Header";
import { useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { Onboarding } from "./pages/Onboarding";
import { ResizeHandle } from "./components/ResizeHandle";
import { DownloadExerciseListener } from "./components/Exercise/DownloadExerciseListener";

const MIN_MAIN = 320;
const MIN_ASIDE = 280;

function App() {
  const [onboardingCompleted, setOnboardingCompleted] = useLocalStorage({
    key: "onboarding-completed",
    defaultValue: false,
  });

  const [asideWidth, setAsideWidth] = useState(512);

  if (!onboardingCompleted)
    return (
      <Onboarding onCompleteOnboarding={() => setOnboardingCompleted(true)} />
    );

  const asideMax = window.innerWidth - MIN_MAIN;

  return (
    <>
      <DownloadExerciseListener />
      <AppShell
        padding="md"
        transitionDuration={0}
        header={{ height: 64 }}
        aside={{ width: asideWidth, breakpoint: "xs" }}
      >
        <AppShell.Header bg="gm-bone">
          <Header />
        </AppShell.Header>
        <AppShell.Main className="flex h-full">
          <WebsiteWrapper />
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
