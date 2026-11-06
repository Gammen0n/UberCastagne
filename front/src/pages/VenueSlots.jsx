import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CheckCircle2, Lock, MapPin, Users } from 'lucide-react'
import Button from '../components/Button.jsx'
import { Stats, Tags } from '../components/Card.jsx'
import Icon from '../components/Icon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { EmptyState, ErrorBanner, LoadMore } from '../components/states.jsx'
import { useApi, usePaginatedApi } from '../lib/api.js'
import { dayKey, formatDay, formatMoney, formatNumber, formatTimeRange } from '../lib/format.js'

// Two weekends of evening slots per page.
const PAGE_SIZE = 8

function groupByDay(slots) {
  const days = []
  for (const slot of slots) {
    const key = dayKey(slot.startsAt)
    if (days.at(-1)?.key !== key) days.push({ key, startsAt: slot.startsAt, slots: [] })
    days.at(-1).slots.push(slot)
  }
  return days
}

function Slot({ slot }) {
  return (
    <li className={slot.available ? 'slot' : 'slot slot-booked'}>
      <span className="slot-time">{formatTimeRange(slot.startsAt, slot.endsAt)}</span>
      <span className="slot-price">{formatMoney(slot.price)}</span>
      <span className={slot.available ? 'badge badge-success' : 'badge badge-neutral'}>
        <Icon as={slot.available ? CheckCircle2 : Lock} />
        {slot.available ? 'Available' : 'Booked'}
      </span>
    </li>
  )
}

function VenueInfo({ venue }) {
  const address = [venue.address, [venue.postalCode, venue.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return (
    <section className="panel venue-info" aria-label="Venue details">
      <p className="card-meta">
        <Icon as={MapPin} />
        <span>{address || '—'}</span>
      </p>
      <Tags items={venue.disciplines} label="Accepted disciplines" />
      <Stats
        items={[
          { label: 'Capacity', value: formatNumber(venue.capacity), icon: Users },
          { label: 'Upcoming slots', value: formatNumber(venue.upcomingSlots), icon: CalendarClock },
          { label: '2-hour slot from', value: formatMoney(venue.priceFrom) },
        ]}
      />
    </section>
  )
}

export default function VenueSlots() {
  const { id } = useParams()
  const venuePath = `/api/venues/${encodeURIComponent(id)}`
  const venue = useApi(venuePath)
  const slots = usePaginatedApi(`${venuePath}/slots?limit=${PAGE_SIZE}`)
  const days = useMemo(() => groupByDay(slots.items), [slots.items])

  return (
    <>
      <Button variant="ghost" size="sm" icon={ArrowLeft} to="/venues" className="back-link">
        All venues
      </Button>

      {venue.status === 'error' && <ErrorBanner title="Could not load this venue" message={venue.error} onRetry={venue.reload} />}
      {venue.status === 'loading' && (
        <div className="panel" role="status" aria-label="Loading venue">
          <span className="skeleton skeleton-line skeleton-line-lg" />
          <span className="skeleton skeleton-block" />
        </div>
      )}
      {venue.status === 'ready' && venue.data && (
        <>
          <PageHeader title={venue.data.name ?? 'Venue'} subtitle="Upcoming slots, in local time." />
          <VenueInfo venue={venue.data} />

          <section className="page-section" aria-labelledby="slots-title" aria-busy={slots.status === 'loading'}>
            <h2 id="slots-title" className="section-title section-title-spaced">Slots</h2>
            {slots.status === 'loading' && (
              <div className="panel" role="status" aria-label="Loading slots">
                <span className="skeleton skeleton-block" />
              </div>
            )}
            {slots.status === 'error' && <ErrorBanner title="Could not load the slots" message={slots.error} onRetry={slots.reload} />}
            {slots.status === 'ready' && slots.items.length === 0 && (
              <EmptyState
                title="No upcoming slot"
                message="This venue has not published any slot yet."
                action={<Button variant="secondary" to="/venues">Browse other venues</Button>}
              />
            )}
            {slots.status === 'ready' && slots.items.length > 0 && (
              <>
                <div className="slot-days">
                  {days.map((day) => (
                    <section key={day.key} className="panel slot-day" aria-label={formatDay(day.startsAt)}>
                      <h3 className="slot-day-title">{formatDay(day.startsAt)}</h3>
                      <ul className="slot-list">
                        {day.slots.map((slot) => <Slot key={slot.id} slot={slot} />)}
                      </ul>
                    </section>
                  ))}
                </div>
                <LoadMore
                  shown={slots.items.length}
                  total={slots.total}
                  hasMore={slots.hasMore}
                  loading={slots.loadingMore}
                  error={slots.error}
                  onLoadMore={slots.loadMore}
                  noun="slots"
                />
              </>
            )}
          </section>
        </>
      )}
    </>
  )
}
