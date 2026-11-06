import { useEffect, useState } from 'react'

// Amounts come from the API as { amount: integer cents, currency }.
function formatMoney(money) {
  if (!money) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount / 100)
}

async function fetchItems(path) {
  const response = await fetch(path)
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    throw new Error(problem.detail ?? `Request failed (${response.status}).`)
  }
  return (await response.json()).items
}

// BOXING -> Boxing, LIGHT_HEAVYWEIGHT -> Light heavyweight
function label(code) {
  const text = code.toLowerCase().replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function Tags({ items }) {
  return (
    <ul className="tags">
      {items.map((item) => (
        <li key={item}>{label(item)}</li>
      ))}
    </ul>
  )
}

function FighterCard({ fighter }) {
  const { wins, losses, draws } = fighter.record
  const initials = fighter.firstName[0] + fighter.lastName[0]

  return (
    <article className="card">
      <header className="card-header">
        <div className="avatar" aria-hidden="true">{initials}</div>
        <div>
          <h3>{fighter.displayName}</h3>
          <p className="muted">
            {fighter.firstName} {fighter.lastName} · {fighter.city}
          </p>
        </div>
        {fighter.rating !== null && (
          <span className="rating" title="Average rating">★ {fighter.rating.toFixed(1)}</span>
        )}
      </header>

      <Tags items={fighter.disciplines} />

      <dl className="facts">
        <div>
          <dt>Weight class</dt>
          <dd>{label(fighter.weightClass)}</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{fighter.weightKg} kg</dd>
        </div>
        <div>
          <dt>Record</dt>
          <dd>{wins}-{losses}-{draws}</dd>
        </div>
      </dl>

      <p className="bio">{fighter.bio}</p>

      <footer className="card-footer">
        <span>Duel <strong>{formatMoney(fighter.rates.DUEL)}</strong></span>
        <span>Show <strong>{formatMoney(fighter.rates.SHOW)}</strong></span>
      </footer>
    </article>
  )
}

function RoomCard({ room }) {
  return (
    <article className="card">
      <header className="card-header">
        <div>
          <h3>{room.name}</h3>
          <p className="muted">
            {room.address}, {room.postalCode} {room.city}
          </p>
        </div>
      </header>

      <Tags items={room.disciplines} />

      <dl className="facts">
        <div>
          <dt>Capacity</dt>
          <dd>{room.capacity} spectators</dd>
        </div>
        <div>
          <dt>Upcoming slots</dt>
          <dd>{room.upcomingSlots}</dd>
        </div>
      </dl>

      <footer className="card-footer">
        <span>2-hour slot from <strong>{formatMoney(room.priceFrom)}</strong></span>
      </footer>
    </article>
  )
}

// Loads one list from the API and renders its cards, or a loading / error / empty message.
function Section({ id, title, path, empty, renderCard }) {
  const [state, setState] = useState({ status: 'loading', items: [] })

  useEffect(() => {
    let cancelled = false
    fetchItems(path)
      .then((items) => !cancelled && setState({ status: 'ready', items }))
      .catch((error) => !cancelled && setState({ status: 'error', items: [], message: error.message }))
    return () => {
      cancelled = true
    }
  }, [path])

  return (
    <section className="catalog-section" aria-labelledby={id} aria-busy={state.status === 'loading'}>
      <h2 id={id}>
        {title} {state.status === 'ready' && <span className="count">{state.items.length}</span>}
      </h2>
      {state.status === 'loading' && <p className="muted">Loading…</p>}
      {state.status === 'error' && <p className="error">Could not load {title.toLowerCase()}: {state.message}</p>}
      {state.status === 'ready' && state.items.length === 0 && <p className="muted">{empty}</p>}
      {state.items.length > 0 && <div className="card-grid">{state.items.map(renderCard)}</div>}
    </section>
  )
}

export default function Catalog() {
  return (
    <main className="catalog">
      <h1>Catalog</h1>

      <Section
        id="fighters"
        title="Fighters"
        path="/api/fighters?limit=100"
        empty="No fighter available yet."
        renderCard={(fighter) => <FighterCard key={fighter.id} fighter={fighter} />}
      />

      <Section
        id="rooms"
        title="Rooms"
        path="/api/venues?limit=100"
        empty="No room available yet."
        renderCard={(room) => <RoomCard key={room.id} room={room} />}
      />
    </main>
  )
}
