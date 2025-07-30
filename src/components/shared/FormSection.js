import React from 'react';

export default function FormSection({ 
  title, 
  children, 
  className = '',
  showDivider = true 
}) {
  return (
    <div className={className}>
      {showDivider && <hr className="border-[#232323] my-4" />}
      {title && (
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
} 