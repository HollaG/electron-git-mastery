import { useModals } from "@mantine/modals";
import { useWebContentsView } from "../contexts/WebContentsViewContext";

export const useElectronModals = () => {
  const modals = useModals();
  const { hide, show } = useWebContentsView();

  const open = (...args: Parameters<typeof modals.openModal>) => {
    hide();
    const modalId = modals.openModal(...args);
    return modalId;
  };

  const openConfirmModal = (
    ...args: Parameters<typeof modals.openConfirmModal>
  ) => {
    hide();
    const modalId = modals.openConfirmModal(...args);
    return modalId;
  };

  const close = (modalId: string) => {
    modals.closeModal(modalId);
    show();
  };

  const closeAll = () => {
    modals.closeAll();
    show();
  };

  return { open, close, openConfirmModal, closeAll };
};
