import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Modal } from "../components/ui/Modal";

type ModalOptions = {
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
};

type ModalEntry = ModalOptions & { id: string };

type ModalState = {
  /** Opens a modal and returns the id needed to close it again. */
  openModal: (options: ModalOptions) => string;
  closeModal: (id: string) => void;
};

const ModalContext = createContext<ModalState | null>(null);

let nextModalId = 0;

/**
 * Imperative modals for flows that open a dialog from an event handler rather
 * than from render state (exercise intro, verification result).
 *
 * The stack renders here, so it must sit inside every provider the modal bodies
 * read from. `Modal` claims the native-view suppression itself, which is why
 * there is no separate bridge for it.
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalEntry[]>([]);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => prev.filter((modal) => modal.id !== id));
  }, []);

  const openModal = useCallback((options: ModalOptions) => {
    const id = `modal-${(nextModalId += 1)}`;
    setModals((prev) => [...prev, { id, ...options }]);
    return id;
  }, []);

  const value = useMemo(
    () => ({ openModal, closeModal }),
    [openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map((modal) => (
        <Modal
          key={modal.id}
          opened
          onClose={() => closeModal(modal.id)}
          title={modal.title}
          size={modal.size}
        >
          {modal.children}
        </Modal>
      ))}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
