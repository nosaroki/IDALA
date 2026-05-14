export default function OptimizedImage({ src, alt, style, className, onClick }) {
  if (!src) return null
  
  const optimizedSrc = src.includes('supabase.co') 
    ? `${src}?format=webp&quality=90`
    : src

  return (
    <img 
      src={optimizedSrc} 
      alt={alt} 
      style={style} 
      className={className}
      onClick={onClick}
    />
  )
}