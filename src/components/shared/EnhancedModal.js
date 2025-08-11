"use client";

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';

// Track body scroll lock across multiple modals to avoid layout shift/flicker
let scrollLockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

/**
 * Enhanced Modal Component with common patterns extracted from the codebase
 * 
 * Features:
 * - Loading states with spinner
 * - Error states with retry functionality
 * - Empty states with custom messages
 * - Action buttons (primary, secondary, danger)
 * - Form layouts with proper spacing
 * - Consistent header structure
 * - Accessibility features
 */
export default function EnhancedModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon: Icon, 
  iconBgColor = "bg-blue-500/10", 
  iconColor = "text-blue-500",
  children, 
  maxWidth = "max-w-4xl",
  disabled = false,
  
  // Loading state
  loading = false,
  loadingTitle = "Loading...",
  loadingSubtitle = "Please wait",
  
  // Error state
  error = null,
  errorTitle = "Error",
  errorMessage = null,
  onRetry = null,
  
  // Empty state
  empty = false,
  emptyTitle = "No Data",
  emptyMessage = "No items to display",
  emptyIcon = null,
  
  // Action buttons
  primaryAction = null,
  secondaryAction = null,
  dangerAction = null,
  
  // Form layout
  isForm = false,
  formActions = null,
  
  // Custom content
  customHeader = null,
  customFooter = null,
  
  ...props
}) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  
  const generateId = () => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch (_) {}
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };
  
  const instanceIdRef = useRef(generateId());
  const instanceId = instanceIdRef.current;
  const titleId = `modal-title-${instanceId}`;
  const descriptionId = `modal-description-${instanceId}`;

  // Keep latest onClose without causing effect re-subscriptions
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    // Lock body scroll with padding compensation to prevent layout shift
    if (scrollLockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        const currentPadding = parseInt(getComputedStyle(document.body).paddingRight || '0', 10) || 0;
        document.body.style.paddingRight = `${currentPadding + scrollBarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount += 1;

    const previouslyFocused = document.activeElement;

    // Focus first focusable element inside dialog
    const focusFirstElement = () => {
      if (!dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        (focusable[0] instanceof HTMLElement ? focusable[0] : null)?.focus();
      } else {
        (closeButtonRef.current instanceof HTMLElement ? closeButtonRef.current : null)?.focus();
      }
    };
    let rafId = requestAnimationFrame(() => {
      focusFirstElement();
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !disabled) {
        e.stopPropagation();
        onCloseRef.current?.();
      } else if (e.key === 'Tab') {
        // Simple focus trap
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (!e.shiftKey && active === last) {
          e.preventDefault();
          (first instanceof HTMLElement ? first : null)?.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          (last instanceof HTMLElement ? last : null)?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(rafId);
      // Unlock body scroll if this is the last modal
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      }
      document.removeEventListener('keydown', handleKeyDown, true);
      if (previouslyFocused && previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, disabled]);

  const handleBackdropMouseDown = (e) => {
    if (disabled) return;
    if (e.target === overlayRef.current) {
      onCloseRef.current?.();
    }
  };

  if (!isOpen) return <div style={{ display: 'none' }} />;

  // Render loading state
  if (loading) {
    return createPortal(
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-150"
        onMouseDown={handleBackdropMouseDown}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative`}
          {...props}
        >
          {/* Header */}
          <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <h2 id={titleId} className="text-xl font-semibold">{loadingTitle}</h2>
                  <p id={descriptionId} className="text-sm text-gray-400">{loadingSubtitle}</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                disabled={disabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Loading Content */}
          <div className="p-6">
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Render error state
  if (error) {
    return createPortal(
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-150"
        onMouseDown={handleBackdropMouseDown}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative`}
          {...props}
        >
          {/* Header */}
          <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 id={titleId} className="text-xl font-semibold">{errorTitle}</h2>
                  <p id={descriptionId} className="text-sm text-gray-400">An error occurred</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                disabled={disabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Content */}
          <div className="p-6">
            <div className="text-center py-8 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 mb-4">
                  {errorMessage || error.message || "An unexpected error occurred"}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                {onRetry && (
                  <Button onClick={onRetry} variant="primary">
                    Try Again
                  </Button>
                )}
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Render empty state
  if (empty) {
    return createPortal(
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-150"
        onMouseDown={handleBackdropMouseDown}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative`}
          {...props}
        >
          {/* Header */}
          <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
                  {subtitle && (
                    <p id={descriptionId} className="text-sm text-gray-400">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                disabled={disabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Empty Content */}
          <div className="p-6">
            <div className="text-center py-8 space-y-4">
              {emptyIcon && (
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                  <emptyIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium">{emptyTitle}</h3>
                <p className="text-sm text-gray-400">{emptyMessage}</p>
              </div>
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Render normal modal
  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-150"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative`}
        {...props}
      >
        {/* Custom Header or Default Header */}
        {customHeader ? (
          customHeader
        ) : (
          <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
                  {subtitle ? (
                    <p id={descriptionId} className="text-sm text-gray-400">{subtitle}</p>
                  ) : (
                    <span id={descriptionId} className="sr-only">Modal dialog</span>
                  )}
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                disabled={disabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`${isForm ? 'p-6 space-y-6' : 'p-6 space-y-6'}`}>
          {children}
        </div>

        {/* Action Buttons */}
        {(primaryAction || secondaryAction || dangerAction) && (
          <div className="sticky bottom-0 bg-surface border-t border-border/50 px-6 py-4">
            <div className="flex gap-3 justify-end">
              {dangerAction && (
                <Button
                  onClick={dangerAction.onClick}
                  variant="danger"
                  disabled={dangerAction.disabled}
                  loading={dangerAction.loading}
                >
                  {dangerAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant="secondary"
                  disabled={secondaryAction.disabled}
                  loading={secondaryAction.loading}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  variant="primary"
                  disabled={primaryAction.disabled}
                  loading={primaryAction.loading}
                >
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Custom Footer */}
        {customFooter && (
          <div className="sticky bottom-0 bg-surface border-t border-border/50 px-6 py-4">
            {customFooter}
          </div>
        )}

        {/* Form Actions */}
        {isForm && formActions && (
          <div className="sticky bottom-0 bg-surface border-t border-border/50 px-6 py-4">
            {formActions}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Helper components for common modal patterns

/**
 * Modal Loading State Component
 */
export function ModalLoadingState({ 
  title = "Loading...", 
  subtitle = "Please wait", 
  icon: Icon,
  iconBgColor = "bg-blue-500/10",
  iconColor = "text-blue-500"
}) {
  return (
    <div className="flex justify-center py-8">
      <div className="text-center space-y-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center mx-auto`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <LoadingSpinner />
      </div>
    </div>
  );
}

/**
 * Modal Error State Component
 */
export function ModalErrorState({ 
  error, 
  title = "Error", 
  onRetry = null, 
  onClose = null 
}) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400 mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        )}
        {onClose && (
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Modal Empty State Component
 */
export function ModalEmptyState({ 
  title = "No Data", 
  message = "No items to display", 
  icon: Icon = null,
  onClose = null 
}) {
  return (
    <div className="text-center py-8 space-y-4">
      {Icon && (
        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-gray-400">{message}</p>
      </div>
      {onClose && (
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      )}
    </div>
  );
}

/**
 * Modal Form Actions Component
 */
export function ModalFormActions({ 
  onSave, 
  onCancel, 
  onDelete = null,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  deleteLabel = "Delete",
  saveDisabled = false,
  saveLoading = false,
  cancelDisabled = false,
  deleteDisabled = false,
  deleteLoading = false
}) {
  return (
    <div className="flex gap-3 justify-end">
      {onDelete && (
        <Button
          onClick={onDelete}
          variant="danger"
          disabled={deleteDisabled}
          loading={deleteLoading}
        >
          {deleteLabel}
        </Button>
      )}
      <Button
        onClick={onCancel}
        variant="secondary"
        disabled={cancelDisabled}
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={onSave}
        variant="primary"
        disabled={saveDisabled}
        loading={saveLoading}
      >
        {saveLabel}
      </Button>
    </div>
  );
}
