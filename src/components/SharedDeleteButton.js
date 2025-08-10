import React from 'react';
import Button from './shared/Button';
import { Trash2 } from 'lucide-react';

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
        <Trash2 className="w-3 h-3" />
      ) : (
        <>
          {icon && <Trash2 className="w-3 h-3 mr-1" />}
          {label}
        </>
      )}
    </Button>
  );
} 