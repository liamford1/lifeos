'use client';

import React, { useId } from 'react';

export default function FormField({ 
  label, 
  children, 
  error, 
  className = '',
  required = false,
  ...props 
}) {
  const id = useId();

  // Clone the child element and add the id prop
  const childWithId = React.isValidElement(children) 
    ? React.cloneElement(children, { id })
    : children;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block font-semibold mb-1 text-white">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {childWithId}
      {error && (
        <div className="text-red-400 text-xs mt-1" role="alert">
          {error}
        </div>
      )}
    </div>
  );
} 