import { useCallback } from 'react';
import { useToast } from '@/components/Toast';

/**
 * Centralized API error handling hook
 * Provides consistent error handling for Supabase operations
 */
export function useApiError() {
  const { showError, showSuccess } = useToast();

  /**
   * Handle Supabase errors with optional toast notification
   * @param {Object} error - Supabase error object
   * @param {Object} options - Error handling options
   * @param {string} options.customMessage - Custom error message to show instead of error.message
   * @param {boolean} options.showToast - Whether to show a toast notification (default: true)
   * @param {Function} options.onError - Custom error handler function
   * @returns {Object} - Error object with standardized format
   */
  const handleError = useCallback((error, options = {}) => {
    const {
      customMessage,
      showToast = true,
      onError
    } = options;

    // Create standardized error object
    const errorObj = {
      message: customMessage || error?.message || 'An unexpected error occurred',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      originalError: error
    };

    // Call custom error handler if provided
    if (onError) {
      onError(errorObj);
    }

    // Show toast if enabled
    if (showToast) {
      showError(errorObj.message);
    }

    return errorObj;
  }, [showError]);

  /**
   * Handle successful operations with optional toast notification
   * @param {string} message - Success message
   * @param {Object} options - Success handling options
   * @param {boolean} options.showToast - Whether to show a toast notification (default: true)
   * @param {Function} options.onSuccess - Custom success handler function
   */
  const handleSuccess = useCallback((message, options = {}) => {
    const {
      showToast = true,
      onSuccess
    } = options;

    // Call custom success handler if provided
    if (onSuccess) {
      onSuccess(message);
    }

    // Show toast if enabled
    if (showToast) {
      showSuccess(message);
    }
  }, [showSuccess]);

  /**
   * Wrapper for Supabase operations with automatic error handling
   * @param {Function} operation - Async function that returns { data, error }
   * @param {Object} options - Error handling options
   * @returns {Promise<Object>} - Result with data and error properties
   */
  const withErrorHandling = useCallback(async (operation, options = {}) => {
    try {
      const result = await operation();
      
      if (result.error) {
        const errorObj = handleError(result.error, options);
        return { data: null, error: errorObj };
      }

      return { data: result.data, error: null };
    } catch (error) {
      const errorObj = handleError(error, options);
      return { data: null, error: errorObj };
    }
  }, [handleError]);

  return {
    handleError,
    handleSuccess,
    withErrorHandling
  };
} 