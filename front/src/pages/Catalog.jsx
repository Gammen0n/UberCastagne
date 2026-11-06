import { fighters, rooms } from '../data/catalog.js'

const euros = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

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
        <span className="rating" title="Average rating">★ {fighter.rating.toFixed(1)}</span>
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
        <span>Duel <strong>{euros.format(fighter.rates.DUEL / 100)}</strong></span>
        <span>Show <strong>{euros.format(fighter.rates.SHOW / 100)}</strong></span>
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
          <dt>City</dt>
          <dd>{room.city}</dd>
        </div>
      </dl>

      <footer className="card-footer">
        <span>2-hour slot <strong>{euros.format(room.slotPrice / 100)}</strong></span>
      </footer>
    </article>
  )
}

function Section({ id, title, count, children }) {
  return (
    <section className="catalog-section" aria-labelledby={id}>
      <h2 id={id}>
        {title} <span className="count">{count}</span>
      </h2>
      <div className="card-grid">{children}</div>
    </section>
  )
}

export default function Catalog() {
  return (
    <main className="catalog">
      <h1>Catalog</h1>

      <Section id="fighters" title="Fighters" count={fighters.length}>
        {fighters.map((fighter) => (
          <FighterCard key={fighter.id} fighter={fighter} />
        ))}
      </Section>

      <Section id="rooms" title="Rooms" count={rooms.length}>
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </Section>
    </main>
  )
}
