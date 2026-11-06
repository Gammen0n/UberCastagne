import { useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, MapPin, Star } from 'lucide-react'
import Button from '../components/Button.jsx'
import { Stats, Tags } from '../components/Card.jsx'
import Icon from '../components/Icon.jsx'
import { EmptyState, ErrorBanner } from '../components/states.jsx'
import { useApi } from '../lib/api.js'
import {
  formatCode,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRating,
  formatRecord,
  formatShortDay,
  formatTimeRange,
  initials,
} from '../lib/format.js'

const PACKAGES = ['DUEL', 'SHOW', 'CHAMPION', 'MERCENARY']

function BackLink() {
  return (
    <Button variant="ghost" size="sm" icon={ArrowLeft} to="/fighters" className="back-link">
      All fighters
    </Button>
  )
}

// Five stars, filled up to the rating; the number is the accessible text.
function StarRating({ value }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon key={star} as={Star} className={star <= value ? 'star star-on' : 'star'} />
      ))}
    </span>
  )
}

function Hero({ fighter }) {
  const fullName = [fighter.firstName, fighter.lastName].filter(Boolean).join(' ')
  return (
    <header className="profile-hero">
      <div className="avatar avatar-lg" aria-hidden="true">
        {initials(fighter.firstName, fighter.lastName)}
      </div>
      <div className="profile-identity">
        <h1 className="profile-name">{fighter.displayName ?? fullName}</h1>
        <p className="profile-meta">
          {fullName && <span>{fullName}</span>}
          <span className="profile-meta-item">
            <Icon as={MapPin} />
            {fighter.city ?? '—'}
          </span>
        </p>
        <Tags items={fighter.disciplines} />
      </div>
      <div className="profile-rating">
        <span className="profile-rating-value">
          <Icon as={Star} size="md" className="rating-icon" />
          {formatRating(fighter.rating)}
        </span>
        <span className="profile-rating-count">
          {fighter.reviewCount} {fighter.reviewCount === 1 ? 'review' : 'reviews'}
        </span>
      </div>
    </header>
  )
}

function Reviews({ reviews }) {
  return (
    <section className="panel" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="section-title">Reviews</h2>
      {reviews.length === 0 ? (
        <EmptyState title="No review yet" message="Reviews appear after a completed fight." />
      ) : (
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id} className="review">
              <div className="review-head">
                <StarRating value={review.rating} />
                <time className="review-date" dateTime={review.createdAt}>{formatDateTime(review.createdAt)}</time>
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Rates({ rates }) {
  const offered = PACKAGES.filter((pkg) => rates?.[pkg])
  return (
    <section className="panel" aria-labelledby="rates-title">
      <h2 id="rates-title" className="section-title">Rates</h2>
      {offered.length === 0 ? (
        <p className="panel-note">No rate published yet.</p>
      ) : (
        <dl className="rate-list">
          {offered.map((pkg) => (
            <div key={pkg} className="rate">
              <dt>{formatCode(pkg)}</dt>
              <dd className="price-value">{formatMoney(rates[pkg])}</dd>
            </div>
          ))}
        </dl>
      )}
      <Button disabled title="Coming soon" className="panel-action">Book</Button>
    </section>
  )
}

function Availability({ periods }) {
  return (
    <section className="panel" aria-labelledby="availability-title">
      <h2 id="availability-title" className="section-title">Next availability</h2>
      {periods.length === 0 ? (
        <p className="panel-note">No upcoming availability.</p>
      ) : (
        <ul className="availability-list">
          {periods.map((period) => (
            <li key={period.id} className="availability">
              <Icon as={CalendarClock} />
              <span className="availability-day">{formatShortDay(period.startsAt)}</span>
              <span className="availability-time">{formatTimeRange(period.startsAt, period.endsAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile">
      <div className="profile-hero" aria-hidden="true">
        <span className="skeleton skeleton-avatar avatar-lg" />
        <div className="profile-identity">
          <span className="skeleton skeleton-line skeleton-line-lg" />
          <span className="skeleton skeleton-line skeleton-line-sm" />
        </div>
      </div>
      <div className="profile-layout" aria-hidden="true">
        <div className="panel"><span className="skeleton skeleton-block" /></div>
        <div className="panel"><span className="skeleton skeleton-block" /></div>
      </div>
    </div>
  )
}

export default function FighterProfile() {
  const { id } = useParams()
  const { status, data: fighter, error, reload } = useApi(`/api/fighters/${encodeURIComponent(id)}`)

  return (
    <>
      <BackLink />
      {status === 'loading' && <ProfileSkeleton />}
      {status === 'error' && (
        <ErrorBanner title="Could not load this fighter" message={error} onRetry={reload} />
      )}
      {status === 'ready' && fighter && (
        <>
          <Hero fighter={fighter} />
          <div className="profile-layout">
            <div className="profile-main">
              <section className="panel" aria-labelledby="about-title">
                <h2 id="about-title" className="section-title">About</h2>
                <Stats
                  items={[
                    { label: 'Category', value: formatCode(fighter.weightClass), text: true },
                    { label: 'Weight', value: formatNumber(fighter.weightKg, 'kg') },
                    { label: 'Record', value: formatRecord(fighter.record) },
                    { label: 'Level', value: fighter.declaredLevel == null ? formatNumber(null) : `${fighter.declaredLevel}/10` },
                  ]}
                />
                {fighter.bio ? <p className="profile-bio">{fighter.bio}</p> : <p className="panel-note">No biography yet.</p>}
              </section>
              <Reviews reviews={fighter.reviews ?? []} />
            </div>
            <aside className="profile-side" aria-label="Booking information">
              <Rates rates={fighter.rates} />
              <Availability periods={fighter.upcomingAvailability ?? []} />
            </aside>
          </div>
        </>
      )}
    </>
  )
}
