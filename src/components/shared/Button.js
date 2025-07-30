'use client';

import React from 'react';
// src/components/Button.js
export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false, // explicitly handle loading
  'aria-label': ariaLabel, // allow aria-label
  ...rest // forward other props (but not loading)
}) {
  const baseClasses = 'rounded transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-card/80';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-card text-base focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    outline: 'border border-gray-300 bg-transparent text-base focus:ring-gray-500',
    ghost: 'bg-transparent text-base focus:ring-gray-500',
    link: 'bg-transparent text-blue-600 hover:text-blue-700 underline focus:ring-blue-500',
    none: '' // No color classes
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  // Remove loading from rest so it doesn't get passed to the DOM
  const { loading: _omitLoading, ...restProps } = rest;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      aria-label={ariaLabel}
      {...restProps}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
  