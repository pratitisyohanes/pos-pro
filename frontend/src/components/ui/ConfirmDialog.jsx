import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', variant = 'danger', isLoading, onConfirm, onClose, children }) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
      {children}
    </Modal>
  );
}
