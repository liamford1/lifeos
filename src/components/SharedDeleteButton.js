import React from 'react';
import Button from './Button';

export default function SharedDeleteButton({
  onClick,
  label = 'Delete',
  icon = true,
  size = 'sm',
  className = '',
  ...rest
}) {
  return (
    <Button
      variant="danger"
      size={size}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {icon && <span role="img" aria-label="delete" className="mr-1">🗑️</span>}
      {label}
    </Button>
  );
} 