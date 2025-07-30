import { useState, useCallback } from 'react';
import { z } from 'zod';
import { mapZodErrors } from '@/lib/utils/validationHelpers';

/**
 * Custom hook for centralized form validation
 * @param {Object} schema - Zod schema for validation
 * @param {Function} onSubmit - Callback function when form is valid
 * @param {Object} options - Additional options
 * @returns {Object} Form validation state and handlers
 */
export function useFormValidation(schema, onSubmit, options = {}) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((formData) => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const errors = mapZodErrors(result.error);
      setFieldErrors(errors);
      return { isValid: false, errors };
    }
    setFieldErrors({});
    return { isValid: true, data: result.data };
  }, [schema]);

  const handleSubmit = useCallback(async (e, formData) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const validation = validateForm(formData);
      if (!validation.isValid) {
        return;
      }

      if (onSubmit) {
        await onSubmit(validation.data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFieldErrors({ general: error.message || 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, onSubmit]);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const setFieldError = useCallback((field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const getFieldError = useCallback((field) => {
    return fieldErrors[field];
  }, [fieldErrors]);

  return {
    fieldErrors,
    isSubmitting,
    validateForm,
    handleSubmit,
    clearErrors,
    setFieldError,
    getFieldError,
  };
} 