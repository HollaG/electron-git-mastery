import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WebContentsViewProvider } from "./contexts/WebContentsViewProvider";
import { ActivityProvider } from "./contexts/ActivityProvider";
import { GitMasteryTaskProvider } from "./contexts/GitMasteryTaskProvider";
import { ModalProvider } from "./contexts/ModalProvider";
import { ToastProvider } from "./contexts/ToastProvider";

const queryClient = new QueryClient();

// Ordering matters: modals and toasts are rendered by their providers, so those
// providers sit inside every context their content reads from — and inside
// WebContentsViewProvider, whose suppression they claim while on screen.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GitMasteryTaskProvider>
        <WebContentsViewProvider>
          <ToastProvider>
            <ModalProvider>
              <ActivityProvider>
                <App />
              </ActivityProvider>
            </ModalProvider>
          </ToastProvider>
        </WebContentsViewProvider>
      </GitMasteryTaskProvider>
    </QueryClientProvider>
  </StrictMode>,
);
