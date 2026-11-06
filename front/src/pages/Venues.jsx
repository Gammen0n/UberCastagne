import PageHeader from '../components/PageHeader.jsx'
import VenueCard from '../components/VenueCard.jsx'
import Button from '../components/Button.jsx'
import { EmptyState, ErrorBanner, SkeletonGrid } from '../components/states.jsx'
import { useApi } from '../lib/api.js'

export default function Venues() {
  const { status, data, error, reload } = useApi('/api/venues?limit=100')
  const venues = data?.items ?? []

  return (
    <>
      <PageHeader
        title="Venues"
        subtitle="Partner clubs and gyms that host supervised fights."
        count={status === 'ready' ? venues.length : undefined}
      />

      <section className="page-section" aria-label="Venue list" aria-busy={status === 'loading'}>
        {status === 'loading' && <SkeletonGrid label="Loading venues" />}
        {status === 'error' && <ErrorBanner title="Could not load the venues" message={error} onRetry={reload} />}
        {status === 'ready' && venues.length === 0 && (
          <EmptyState
            title="No venue available yet"
            message="Partner venues will appear here as soon as they publish slots."
            action={<Button variant="secondary" to="/fighters">Browse fighters</Button>}
          />
        )}
        {status === 'ready' && venues.length > 0 && (
          <div className="card-grid">
            {venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
          </div>
        )}
      </section>
    </>
  )
}
