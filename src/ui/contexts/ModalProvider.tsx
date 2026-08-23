import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Modal } from "../components/ui/Modal";
import {
  ModalContext,
  type ModalEntry,
  type ModalOptions,
} from "./ModalContext";

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
