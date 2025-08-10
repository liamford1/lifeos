import Button from '@/components/shared/Button';

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
        <span role="img" aria-label="edit" className="text-sm">✏️</span>
      ) : (
        <>
          <span role="img" aria-label="edit" className="mr-1">✏️</span>
          Edit
        </>
      )}
    </Button>
  );
} 