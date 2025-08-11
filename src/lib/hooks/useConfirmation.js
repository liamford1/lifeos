import { useState, useCallback } from 'react';

/**
 * Custom hook for handling confirmations
 * Provides a simple way to show confirmation dialogs without window.confirm
 * 
 * @param {Function} onConfirm - Function to call when user confirms
 * @returns {Object} - Confirmation state and handlers
 */
export function useConfirmation(onConfirm) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const showConfirmation = useCallback((confirmMessage) => {
    setMessage(confirmMessage);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm();
    setIsOpen(false);
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    message,
    showConfirmation,
    handleConfirm,
    handleCancel
  };
}

/**
 * Simple confirmation dialog component for page-level confirmations
 * This is a lightweight alternative to the full ConfirmationModal for simple cases
 */
export function SimpleConfirmationDialog({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
