import { createContext, useContext, type ReactNode } from "react";

export type ToastTone = "neutral" | "success" | "danger" | "warning" | "info";

export type ToastOptions = {
  /** Stable id so a long-running task can update its own toast in place. */
  id?: string;
  title?: string;
  message?: string;
  tone?: ToastTone;
  loading?: boolean;
  icon?: ReactNode;
  /** Milliseconds, or `false` to keep the toast until it is updated or hidden. */
  autoClose?: number | false;
  withCloseButton?: boolean;
};

export type Toast = Omit<ToastOptions, "id"> & { id: string };

export type ToastState = {
  showToast: (options: ToastOptions) => string;
  /** No-op when `id` is unknown — callers rely on this to tell create from update. */
  updateToast: (id: string, patch: Omit<ToastOptions, "id">) => void;
  hideToast: (id: string) => void;
};

export const ToastContext = createContext<ToastState | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
