import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WebContentsViewProvider } from "./contexts/WebContentsViewContext";
import { ActivityProvider } from "./contexts/ActivityContext";
import { GitMasteryTaskProvider } from "./contexts/GitMasteryTaskContext";
import { ModalProvider } from "./contexts/ModalContext";
import { ToastProvider } from "./contexts/ToastContext";

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
