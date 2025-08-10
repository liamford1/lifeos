import Button from '@/components/shared/Button';
import { Pencil } from 'lucide-react';

export default function EditButton({ href, onClick, size = "sm", className = "", iconOnly = false }) {
  return (
    <Button
      onClick={onClick}
      variant="primary"
      size={size}
      className={`${iconOnly ? 'p-2 min-w-0' : ''} ${className}`}
      aria-label={iconOnly ? "Edit" : undefined}
    >
      {iconOnly ? (
        <Pencil className="w-3 h-3" />
      ) : (
        <>
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </>
      )}
    </Button>
  );
} 