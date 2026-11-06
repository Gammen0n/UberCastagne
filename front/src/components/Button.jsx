import { Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import Icon from './Icon.jsx'

// variant: primary | secondary | ghost | danger. Pass `to` for a navigation link.
export default function Button({
  variant = 'primary',
  size,
  to,
  icon,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className].filter(Boolean).join(' ')
  const content = (
    <>
      {loading ? <Icon as={LoaderCircle} className="btn-spinner" /> : icon && <Icon as={icon} />}
      <span>{children}</span>
    </>
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  )
}
