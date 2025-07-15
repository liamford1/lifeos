export default function FormLabel({ children, className = '', ...props }) {
  return (
    <label 
      className={`block font-semibold mb-1 text-white ${className}`}
      {...props}
    >
      {children}
    </label>
  );
} 