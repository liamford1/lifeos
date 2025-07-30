"use client";
import React from 'react';

const LoadingSpinner = ({ size = 48 }) => (
  <div className="flex justify-center items-center h-full">
    <div 
      className="animate-spin rounded-full border-t-4 border-b-4 border-blue-500"
      style={{ width: size, height: size }}
    ></div>
  </div>
);

export default LoadingSpinner; 