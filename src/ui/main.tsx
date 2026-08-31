import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WebContentsViewProvider } from "./providers/WebContentsViewProvider";
import { ActivityProvider } from "./providers/ActivityProvider";
import { GitMasteryTaskProvider } from "./providers/GitMasteryTaskProvider";
import { ModalProvider } from "./providers/ModalProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { ChatPanel } from "./pages/ChatPanel";

const queryClient = new QueryClient();
const root = document.getElementById("root")!;

if (location.hash === "#chat") {
  document.documentElement.classList.add("gm-chat-overlay");
  createRoot(root).render(
    <StrictMode>
      <ChatPanel />
    </StrictMode>,
  );
} else {
  // Ordering matters: modals and toasts are rendered by their providers, so those
  // providers sit inside every context their content reads from — and inside
  // WebContentsViewProvider, whose suppression they claim while on screen.
  createRoot(root).render(
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
}
