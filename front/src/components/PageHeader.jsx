export default function PageHeader({ title, subtitle, count, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">
          {title}
          {count !== undefined && count !== null && (
            <span className="count-badge" aria-label={`${count} results`}>{count}</span>
          )}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}
