import React from 'react';

export default function FormTextarea({ 
  className = '', 
  disabled = false,
  rows = 3,
  // Pass an id prop for accessibility to associate with FormLabel
  ...props 
}) {
  return (
    <textarea
      className={`w-full p-2 bg-surface rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      rows={rows}
      {...props}
    />
  );
} 