import Icon from './Icon.jsx'
import { formatCode } from '../lib/format.js'

export function Card({ children, className = '', ...props }) {
  return (
    <article className={`card ${className}`} {...props}>
      {children}
    </article>
  )
}

export function Tags({ items, label = 'Disciplines' }) {
  if (!items?.length) return null
  return (
    <ul className="tags" aria-label={label}>
      {items.map((item) => (
        <li key={item} className="tag">
          {formatCode(item)}
        </li>
      ))}
    </ul>
  )
}

// A row of statistics separated by vertical rules. `value` is already formatted ('—' when missing).
// The label comes first in the markup (dt before dd); CSS shows the value on top.
export function Stats({ items }) {
  return (
    <dl className="stats">
      {items.map(({ label, value, icon, text }) => (
        <div key={label} className="stat">
          <dt className="stat-label">{label}</dt>
          <dd className={text ? 'stat-value stat-value-text' : 'stat-value'}>
            {icon && <Icon as={icon} className="stat-icon" />}
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
