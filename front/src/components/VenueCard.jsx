import { CalendarClock, MapPin, Users } from 'lucide-react'
import Button from './Button.jsx'
import { Card, Stats, Tags } from './Card.jsx'
import Icon from './Icon.jsx'
import { formatMoney, formatNumber } from '../lib/format.js'

export default function VenueCard({ venue }) {
  const address = [venue.address, [venue.postalCode, venue.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  const titleId = `venue-${venue.id}`

  return (
    <Card className="card-interactive" aria-labelledby={titleId}>
      <header className="card-head">
        <div className="card-identity">
          <h3 id={titleId} className="card-title">{venue.name ?? '—'}</h3>
          <p className="card-meta">
            <Icon as={MapPin} />
            <span>{address || '—'}</span>
          </p>
        </div>
      </header>

      <Tags items={venue.disciplines} label="Accepted disciplines" />

      <Stats
        items={[
          { label: 'Capacity', value: formatNumber(venue.capacity), icon: Users },
          { label: 'Upcoming slots', value: formatNumber(venue.upcomingSlots), icon: CalendarClock },
        ]}
      />

      <footer className="card-foot">
        <p className="price">
          <span className="price-label">2-hour slot from</span>
          <span className="price-value">{formatMoney(venue.priceFrom)}</span>
        </p>
        <div className="card-actions">
          <Button variant="secondary" size="sm" disabled title="Coming soon">See slots</Button>
        </div>
      </footer>
    </Card>
  )
}
