export default function FormSection({ 
  title, 
  children, 
  className = '',
  showDivider = true 
}) {
  return (
    <div className={className}>
      {showDivider && <hr className="border-gray-700 my-4" />}
      {title && (
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
} 