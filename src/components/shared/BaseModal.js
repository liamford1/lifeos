"use client";

import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

// Track body scroll lock across multiple modals to avoid layout shift/flicker
let scrollLockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

export default function BaseModal({ 
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
        {/* Header */}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}