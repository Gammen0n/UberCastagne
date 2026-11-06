import { useEffect, useMemo, useState } from 'react'
import FighterCard from '../components/FighterCard.jsx'
import FilterBar from '../components/FilterBar.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Button from '../components/Button.jsx'
import { EmptyState, ErrorBanner, SkeletonGrid } from '../components/states.jsx'
import { useApi } from '../lib/api.js'
import { formatCode, lowestRate } from '../lib/format.js'

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
      { value: '', label: 'Recommended' },
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

export default function Fighters() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const city = useDebounced(filters.city.trim(), 300)

  // City, discipline and weight class are filtered by the API (GET /api/fighters).
  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })
    if (filters.discipline) params.set('discipline', filters.discipline)
    if (filters.weightClass) params.set('weightClass', filters.weightClass)
    if (city) params.set('city', city)
    return `/api/fighters?${params}`
  }, [filters.discipline, filters.weightClass, city])

  const { status, data, error, reload } = useApi(path)

  // Rating, price and sort are applied in the browser on the list already received.
  const fighters = useMemo(() => {
    const minRating = filters.minRating ? Number(filters.minRating) : null
    const maxCents = filters.maxPrice !== '' ? Number(filters.maxPrice) * 100 : null
    const list = (data?.items ?? []).filter((fighter) => {
      if (minRating !== null && (fighter.rating ?? 0) < minRating) return false
      const rate = lowestRate(fighter.rates)
      if (maxCents !== null && (!rate || rate.amount > maxCents)) return false
      return true
    })
    const price = (fighter) => lowestRate(fighter.rates)?.amount ?? Infinity
    if (filters.sort === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (filters.sort === 'price') list.sort((a, b) => price(a) - price(b))
    if (filters.sort === 'name') list.sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? ''))
    return list
  }, [data, filters.minRating, filters.maxPrice, filters.sort])

  const reset = () => setFilters(EMPTY_FILTERS)

  return (
    <>
      <PageHeader
        title="Fighters"
        subtitle="Approved professional fighters available for a supervised Duel or Show."
        count={status === 'ready' ? fighters.length : undefined}
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
          <div className="card-grid">
            {fighters.map((fighter) => <FighterCard key={fighter.id} fighter={fighter} />)}
          </div>
        )}
      </section>
    </>
  )
}
