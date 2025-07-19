import React from 'react';

export default function DeleteButton({ onClick, loading, label, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={ariaLabel || label || 'Delete'}
      className={
        'ml-2 flex items-center space-x-1 p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-500 disabled:opacity-60 disabled:cursor-not-allowed'
      }
    >
      {loading ? (
        <span className="inline-block w-4 h-4 animate-spin border-2 border-t-transparent border-red-500 rounded-full"></span>
      ) : (
        <span className="text-lg" role="img" aria-label="delete">{label ? '🗑️' : '❌'}</span>
      )}
      {label && !loading && (
        <span className="font-medium text-red-600 text-sm">{label}</span>
      )}
    </button>
  );
} 