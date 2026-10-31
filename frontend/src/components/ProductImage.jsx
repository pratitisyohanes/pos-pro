export default function ProductImage({ product, className = '' }) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} className={`object-cover ${className}`} loading="lazy" />;
  }
  // Fallback cover built from the product initials when no image is set
  const initials = product.name
    .split(' ')
    .filter((word) => /^[A-Za-z0-9]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 ${className}`}>
      <span className="text-3xl font-bold text-brand-700/70">{initials}</span>
    </div>
  );
}
