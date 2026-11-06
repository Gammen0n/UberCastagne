import { MapPin, Star } from 'lucide-react'
import Button from './Button.jsx'
import { Card, Stats, Tags } from './Card.jsx'
import Icon from './Icon.jsx'
import {
  formatCode,
  formatMoney,
  formatNumber,
  formatRating,
  formatRecord,
  initials,
  lowestRate,
} from '../lib/format.js'

const COMING_SOON = 'Coming soon'

export default function FighterCard({ fighter }) {
  const fullName = [fighter.firstName, fighter.lastName].filter(Boolean).join(' ')
  const titleId = `fighter-${fighter.id}`

  return (
    <Card className="card-interactive" aria-labelledby={titleId}>
      <header className="card-head">
        <div className="avatar" aria-hidden="true">
          {initials(fighter.firstName, fighter.lastName) || initials(fighter.displayName)}
        </div>
        <div className="card-identity">
          <h3 id={titleId} className="card-title">{fighter.displayName ?? fullName}</h3>
          {fullName && <p className="card-subtitle">{fullName}</p>}
          <p className="card-meta">
            <Icon as={MapPin} />
            <span>{fighter.city ?? '—'}</span>
          </p>
        </div>
        <p className="rating">
          <Icon as={Star} label="Rating" className="rating-icon" />
          <span>{formatRating(fighter.rating)}</span>
        </p>
      </header>

      <Tags items={fighter.disciplines} />

      <Stats
        items={[
          { label: 'Category', value: formatCode(fighter.weightClass), text: true },
          { label: 'Weight', value: formatNumber(fighter.weightKg, 'kg') },
          { label: 'Record', value: formatRecord(fighter.record) },
        ]}
      />

      {fighter.bio && <p className="card-bio">{fighter.bio}</p>}

      <footer className="card-foot">
        <p className="price">
          <span className="price-label">From</span>
          <span className="price-value">{formatMoney(fighter.priceFrom ?? lowestRate(fighter.rates))}</span>
        </p>
        <div className="card-actions">
          <Button variant="ghost" size="sm" to={`/fighters/${fighter.id}`} aria-label={`Profile of ${fighter.displayName ?? fullName}`}>
            Profile
          </Button>
          <Button size="sm" disabled title={COMING_SOON}>Book</Button>
        </div>
      </footer>
    </Card>
  )
}
