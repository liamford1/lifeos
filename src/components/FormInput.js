export default function FormInput({ 
  className = '', 
  disabled = false,
  // Pass an id prop for accessibility to associate with FormLabel
  ...props 
}) {
  return (
    <input
      className={`w-full p-2 bg-surface rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
} 