'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Button from './Button'; // Added import for Button

// Create a context for the toast state
const ToastContext = createContext();

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook for managing toasts
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default function Toast({ 
  message, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  duration = 5000,
  onClose,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500 text-white';
      case 'error':
        return 'bg-red-600 border-red-500 text-white';
      case 'warning':
        return 'bg-yellow-600 border-yellow-500 text-white';
      case 'info':
        return 'bg-blue-600 border-blue-500 text-white';
      default:
        return 'bg-card border-[#232323] text-base';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💬';
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed z-50 ${getPositionStyles()} max-w-sm w-full`}>
      <div className={`flex items-center p-4 rounded-lg shadow-lg border ${getTypeStyles()} animate-in slide-in-from-top-2 duration-300`}>
        <span className="mr-2 text-lg">{getIcon()}</span>
        <span className="flex-1 text-sm font-medium">{message}</span>
        <Button
          onClick={handleClose}
          variant="secondary"
          size="sm"
          className="ml-2"
          aria-label="Close toast"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}

// Toast Container Component for managing multiple toasts
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
} 