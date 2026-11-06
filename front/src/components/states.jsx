import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'

// Placeholder cards with the same shape as the real ones.
export function SkeletonGrid({ count = 6, label }) {
  return (
    <div className="card-grid" role="status" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card skeleton-card" aria-hidden="true">
          <div className="card-head">
            <span className="skeleton skeleton-avatar" />
            <div className="card-identity">
              <span className="skeleton skeleton-line skeleton-line-lg" />
              <span className="skeleton skeleton-line skeleton-line-sm" />
            </div>
          </div>
          <span className="skeleton skeleton-line skeleton-line-md" />
          <span className="skeleton skeleton-block" />
          <span className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <Icon as={Inbox} size="md" />
      <p className="empty-title">{title}</p>
      {message && <p className="empty-message">{message}</p>}
      {action}
    </div>
  )
}

// Shows the plain-language detail from problem+json; never a technical code.
export function ErrorBanner({ title = 'Something went wrong', message, onRetry, action }) {
  return (
    <div className="banner banner-danger" role="alert">
      <Icon as={AlertTriangle} size="md" className="banner-icon" />
      <div className="banner-body">
        <p className="banner-title">{title}</p>
        {message && <p className="banner-message">{message}</p>}
      </div>
      <div className="banner-actions">
        {action}
        {onRetry && (
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}
