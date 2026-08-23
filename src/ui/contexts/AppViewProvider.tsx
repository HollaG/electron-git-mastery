import { useState, type ReactNode } from "react";
import { AppViewContext, type AppView } from "./AppViewContext";

export function AppViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("tours");

  return (
    <AppViewContext.Provider value={{ view, setView }}>
      {children}
    </AppViewContext.Provider>
  );
}
