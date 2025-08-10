import React from 'react';
import Button from './shared/Button';

export default function SharedDeleteButton({
  onClick,
  label = 'Delete',
  icon = true,
  size = 'sm',
  className = '',
  iconOnly = false,
  ...rest
}) {
  return (
    <Button
      variant="danger"
      size={size}
      onClick={onClick}
      className={`${iconOnly ? 'p-2 min-w-0' : ''} ${className}`}
      aria-label={iconOnly ? "Delete" : undefined}
      {...rest}
    >
      {iconOnly ? (
        <span role="img" aria-label="delete" className="text-sm">🗑️</span>
      ) : (
        <>
          {icon && <span role="img" aria-label="delete" className="mr-1">🗑️</span>}
          {label}
        </>
      )}
    </Button>
  );
} 