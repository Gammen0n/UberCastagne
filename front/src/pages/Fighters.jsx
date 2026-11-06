import { useEffect, useMemo, useState } from 'react'
import FighterCard from '../components/FighterCard.jsx'
import FilterBar from '../components/FilterBar.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'
import { EmptyState, ErrorBanner, LoadMore, SkeletonGrid } from '../components/states.jsx'
import { usePaginatedApi } from '../lib/api.js'
import { formatCode } from '../lib/format.js'

// Values of the catalogue enums (db/sql/catalogue/01-schema.sql).
const DISCIPLINES = ['BOXING', 'KICKBOXING', 'MUAY_THAI', 'MMA', 'WRESTLING', 'JUDO']
const WEIGHT_CLASSES = [
  'FLYWEIGHT', 'BANTAMWEIGHT', 'FEATHERWEIGHT', 'LIGHTWEIGHT',
  'WELTERWEIGHT', 'MIDDLEWEIGHT', 'LIGHT_HEAVYWEIGHT', 'HEAVYWEIGHT',
]

const codeOptions = (codes, any) => [{ value: '', label: any }, ...codes.map((code) => ({ value: code, label: formatCode(code) }))]

const FIELDS = [
  { name: 'discipline', label: 'Discipline', type: 'select', options: codeOptions(DISCIPLINES, 'Any discipline') },
  { name: 'weightClass', label: 'Weight class', type: 'select', options: codeOptions(WEIGHT_CLASSES, 'Any class') },
  { name: 'city', label: 'City', type: 'text', placeholder: 'e.g. Pau' },
  {
    name: 'minRating',
    label: 'Min. rating',
    type: 'select',
    options: [
      { value: '', label: 'Any rating' },
      { value: '3', label: '3.0 and up' },
      { value: '4', label: '4.0 and up' },
      { value: '4.5', label: '4.5 and up' },
    ],
  },
  { name: 'maxPrice', label: 'Max. price (€)', type: 'number', min: 0, placeholder: 'e.g. 200' },
  {
    name: 'sort',
    label: 'Sort by',
    type: 'select',
    options: [
      { value: '', label: 'Default' },
      { value: 'rating', label: 'Best rated' },
      { value: 'price', label: 'Lowest price' },
      { value: 'name', label: 'Name' },
    ],
  },
]

const EMPTY_FILTERS = Object.fromEntries(FIELDS.map((field) => [field.name, '']))

function describe(field, value) {
  if (field.type === 'select') return field.options.find((option) => option.value === value)?.label ?? value
  if (field.name === 'maxPrice') return `${value} €`
  return value
}

// Typing in the city field waits a moment before querying the API.
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// Four rows of three cards per page.
const PAGE_SIZE = 12

export default function Fighters() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  // Typed fields wait a moment before querying the API.
  const city = useDebounced(filters.city.trim(), 300)
  const maxPrice = useDebounced(filters.maxPrice, 300)

  // Every filter and the sort are applied by the API (GET /api/fighters); maxPrice is sent in cents.
  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
    if (filters.discipline) params.set('discipline', filters.discipline)
    if (filters.weightClass) params.set('weightClass', filters.weightClass)
    if (city) params.set('city', city)
    if (filters.minRating) params.set('minRating', filters.minRating)
    if (maxPrice !== '' && Number(maxPrice) >= 0) params.set('maxPrice', String(Math.round(Number(maxPrice) * 100)))
    if (filters.sort) params.set('sort', filters.sort)
    return `/api/fighters?${params}`
  }, [filters.discipline, filters.weightClass, filters.minRating, filters.sort, city, maxPrice])

  const { status, items: fighters, total, error, reload, hasMore, loadMore, loadingMore } = usePaginatedApi(path)

  const reset = () => setFilters(EMPTY_FILTERS)

  return (
    <>
      <PageHeader
        title="Fighters"
        subtitle="Approved professional fighters available for a supervised Duel or Show."
        count={status === 'ready' ? total : undefined}
      />

      <FilterBar
        fields={FIELDS}
        values={filters}
        onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
        onReset={reset}
        describe={describe}
      />

      <section className="page-section" aria-label="Fighter list" aria-busy={status === 'loading'}>
        {status === 'loading' && <SkeletonGrid label="Loading fighters" />}
        {status === 'error' && <ErrorBanner title="Could not load the fighters" message={error} onRetry={reload} />}
        {status === 'ready' && fighters.length === 0 && (
          <EmptyState
            title="No fighter matches these filters"
            message="Try a different city or discipline, or widen the price range."
            action={<Button variant="secondary" onClick={reset}>Reset filters</Button>}
          />
        )}
        {status === 'ready' && fighters.length > 0 && (
          <>
            <div className="card-grid">
              {fighters.map((fighter) => <FighterCard key={fighter.id} fighter={fighter} />)}
            </div>
            <LoadMore
              shown={fighters.length}
              total={total}
              hasMore={hasMore}
              loading={loadingMore}
              error={error}
              onLoadMore={loadMore}
              noun="fighters"
            />
          </>
        )}
      </section>
    </>
  )
}
