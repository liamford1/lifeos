import React from 'react';

export default function FormSelect({ 
  className = '', 
  disabled = false,
  children,
  // Pass an id prop for accessibility to associate with FormLabel
  ...props 
}) {
  return (
    <select
      className={`w-full p-2 bg-surface rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </select>
  );
} 