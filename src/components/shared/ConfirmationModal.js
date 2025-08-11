import React from 'react';
import BaseModal from './BaseModal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation modal component to replace window.confirm dialogs
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Function} props.onConfirm - Function to call when user confirms
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Text for confirm button (default: "Delete")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {string} props.confirmVariant - Button variant for confirm button (default: "danger")
 * @param {string} props.icon - Icon to display (default: AlertTriangle)
 * @param {string} props.iconColor - Icon color (default: "text-red-500")
 * @param {string} props.iconBgColor - Icon background color (default: "bg-red-500/10")
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmVariant = "danger",
  icon: Icon = AlertTriangle,
  iconColor = "text-red-500",
  iconBgColor = "bg-red-500/10"
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={message}
      icon={Icon}
      iconBgColor={iconBgColor}
      iconColor={iconColor}
      maxWidth="max-w-md"
      data-testid="confirmation-modal"
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-300 text-sm">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            className="min-w-[80px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

/**
 * Hook for managing confirmation modal state
 * 
 * @param {Function} onConfirm - Function to call when user confirms
 * @returns {Object} - Modal state and handlers
 */
export function useConfirmationModal(onConfirm) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState({});

  const showConfirmation = React.useCallback((modalConfig) => {
    setConfig(modalConfig);
    setIsOpen(true);
  }, []);

  const handleConfirm = React.useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    showConfirmation,
    handleConfirm,
    handleClose
  };
}
