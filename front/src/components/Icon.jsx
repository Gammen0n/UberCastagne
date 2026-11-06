// Lucide icon sized by the tokens (--icon-sm / --icon-md, --icon-stroke). Decorative unless a label is given.
export default function Icon({ as: Glyph, size = 'sm', label, className = '' }) {
  return (
    <Glyph
      className={`icon icon-${size} ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  )
}
