import React from 'react';

export default function FormLabel({ children, className = '', htmlFor, ...props }) {
  return (
    <label 
      className={`block font-semibold mb-1 text-white ${className}`}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
    </label>
  );
} 