import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.layer.css";
import App from "./App.tsx";
import { colorsTuple, createTheme, MantineProvider, Text } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const theme = createTheme({
  primaryColor: "gm-green",
  colors: {
    "gm-green": colorsTuple("#2D864E"),
    "gm-bone": colorsTuple("#F8F8F8"),
    "gm-dark-green": colorsTuple("#717c4d"),
  },
  headings: {
    fontFamily: "Noto Serif, Georgia, serif",
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "2.05rem", lineHeight: "1.3" },
      h2: { fontSize: "1.45rem", lineHeight: "1.35" },
      h3: { fontSize: "1.2rem", lineHeight: "1.4" },
    },
  },
  fontFamily: "Inter, system-ui, sans-serif",
  black: "#333333",
  components: {
    Text: Text.extend({
      styles: (theme, props) => {
        if (props.variant === "subheading") {
          return {
            root: {
              fontWeight: 600,
              color: theme.colors.gray[5],
              // fontFamily: theme.headings.fontFamily,
            },
          };
        }
        return {};
      },
    }),
  },
});

import { WebContentsViewProvider } from "./contexts/WebContentsViewContext";
import { Notifications } from "@mantine/notifications";
import { ActivityProvider } from "./contexts/ActivityContext";
import { ModalsProvider } from "@mantine/modals";
import { GitMasteryTaskProvider } from "./contexts/GitMasteryTaskContext";

const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <ModalsProvider>
          <GitMasteryTaskProvider>
            <WebContentsViewProvider>
              <ActivityProvider>
                <App />
                <Notifications />
              </ActivityProvider>
            </WebContentsViewProvider>
          </GitMasteryTaskProvider>
        </ModalsProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
