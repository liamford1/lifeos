"use client";

import { MdClose } from 'react-icons/md';

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
  disabled = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-200">
      <div className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative transform transition-all duration-200 ease-out`}>
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-gray-400">{subtitle}</p>
              </div>
            </div>
            <button
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
} 