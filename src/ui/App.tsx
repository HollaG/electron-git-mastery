import { AppShell, Box, Button, Group, Space, Title } from "@mantine/core";
import TerminalComponent from "./components/Terminal/Terminal";
import { LeftBarWrapper } from "./components/Navigation/LeftBarWrapper";
import { WebsiteWrapper } from "./components/Website/WebsiteWrapper";
import { InfoBar } from "./components/InfoBar/InfoBar";
import { Header } from "./components/Header/Header";
import { useEffect, useState } from "react";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { Onboarding } from "./pages/Onboarding";
import { ResizeHandle } from "./components/ResizeHandle";

const MIN_NAVBAR = 180;
const MIN_MAIN = 320;
const MIN_ASIDE = 280;

// enum Page {
//   Onboarding,
//   Main
// }

/**
 * Note for future development
 *
 * >> As there are only two "pages" planned:
 *   1. Onboarding
 *   2. Actual work page
 *
 * the routing system uses a simple `enum` to control what page is shown.
 *
 * in the future, explore options such as Tanstack Router
 *
 * @returns
 */
function App() {
  // const [page, setPage] = useState<Page>(Page.Main)
  const [onboardingCompleted, setOnboardingCompleted] = useLocalStorage({
    key: "onboarding-completed",
    defaultValue: false,
  });

  console.log({ onboardingCompleted });

  const [navbarCollapsed, { toggle: toggleNavbar }] = useDisclosure(false);
  const [navbarWidth, setNavbarWidth] = useState(256);
  const [asideWidth, setAsideWidth] = useState(512);

  // useEffect(() => {

  // }, []);

  if (!onboardingCompleted)
    return (
      <Onboarding onCompleteOnboarding={() => setOnboardingCompleted(true)} />
    );

  const visibleNavbarWidth = navbarCollapsed ? 0 : navbarWidth;
  const navbarMax = window.innerWidth - asideWidth - MIN_MAIN;
  const asideMax = window.innerWidth - visibleNavbarWidth - MIN_MAIN;

  return (
    <AppShell
      padding="md"
      transitionDuration={0}
      header={{ height: 64 }}
      navbar={{
        width: navbarWidth,
        breakpoint: "xs",
        collapsed: { desktop: navbarCollapsed },
      }}
      aside={{ width: asideWidth, breakpoint: "xs" }}
      // footer={{ height: 32 }}
    >
      <AppShell.Header bg="gm-bone">
        <Header navbarOpened={!navbarCollapsed} onToggleNavbar={toggleNavbar} />
      </AppShell.Header>
      <AppShell.Navbar bg="gm-bone">
        <Box pos="relative" h="100%">
          <Box p="md" h="100%">
            <LeftBarWrapper />
          </Box>
          <ResizeHandle
            width={navbarWidth}
            min={MIN_NAVBAR}
            max={navbarMax}
            cssVars={["--app-shell-navbar-width", "--app-shell-navbar-offset"]}
            onChange={setNavbarWidth}
          />
        </Box>
      </AppShell.Navbar>
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

      {/* <AppShell.Footer bg="gm-dark-green">
        <Box>
          <InfoBar
          ></InfoBar>
        </Box>
      </AppShell.Footer> */}
    </AppShell>
  );
}

export default App;
