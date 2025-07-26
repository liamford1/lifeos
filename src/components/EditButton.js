import Button from '@/components/Button';

export default function EditButton({ href, onClick, size = "sm", className = "" }) {
  return (
    <Button
      onClick={onClick}
      variant="primary"
      size={size}
      className={className}
    >
      ✏️ Edit
    </Button>
  );
} 