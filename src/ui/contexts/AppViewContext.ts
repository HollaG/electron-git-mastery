import { createContext, useContext } from "react";

export type AppView = "tours" | "exercises";

export type AppViewState = {
  view: AppView;
  setView: (view: AppView) => void;
};

export const AppViewContext = createContext<AppViewState | null>(null);

export function useAppView() {
  const context = useContext(AppViewContext);
  if (!context) {
    throw new Error("useAppView must be used within an AppViewProvider");
  }
  return context;
}
