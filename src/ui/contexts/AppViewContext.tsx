import { createContext, useContext, useState, type ReactNode } from "react";

export type AppView = "tours" | "exercises";

type AppViewState = {
  view: AppView;
  setView: (view: AppView) => void;
};

const AppViewContext = createContext<AppViewState | null>(null);

export function AppViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("tours");

  return (
    <AppViewContext.Provider value={{ view, setView }}>
      {children}
    </AppViewContext.Provider>
  );
}

export function useAppView() {
  const context = useContext(AppViewContext);
  if (!context) {
    throw new Error("useAppView must be used within an AppViewProvider");
  }
  return context;
}
