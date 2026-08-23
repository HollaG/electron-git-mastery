import { createContext, useContext, type ReactNode } from "react";

export type ModalOptions = {
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
};

export type ModalEntry = ModalOptions & { id: string };

export type ModalState = {
  /** Opens a modal and returns the id needed to close it again. */
  openModal: (options: ModalOptions) => string;
  closeModal: (id: string) => void;
};

export const ModalContext = createContext<ModalState | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
