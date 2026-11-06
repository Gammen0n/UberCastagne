import { catalogue, venues } from './db.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class HttpError extends Error {
  constructor(status, title, detail) {
    super(detail)
    this.status = status
    this.title = title
  }
}

const notFound = (what) => new HttpError(404, `${what} not found`, `No ${what.toLowerCase()} matches this id.`)

function sendJson(response, status, body) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

// RFC 9457 problem details (SAD section 3.1).
function sendProblem(response, error) {
  const status = error instanceof HttpError ? error.status : 500
  if (status === 500) console.error(error)
  response.statusCode = status
  response.setHeader('Content-Type', 'application/problem+json')
  response.end(JSON.stringify({
    title: error instanceof HttpError ? error.title : 'Internal error',
    status,
    detail: error instanceof HttpError ? error.message : 'Something went wrong. Please try again later.',
  }))
}

// ---------- Query parameters ----------

function integerParam(params, name, { min, max, fallback }) {
  if (!params.has(name) || params.get(name) === '') return fallback
  const value = Number(params.get(name))
  if (!Number.isInteger(value) || value < min || (max !== undefined && value > max)) {
    const range = max === undefined ? `at least ${min}` : `between ${min} and ${max}`
    throw new HttpError(400, `Invalid ${name}`, `${name} must be an integer ${range}.`)
  }
  return value
}

function numberParam(params, name, { min, max }) {
  if (!params.has(name) || params.get(name) === '') return null
  const value = Number(params.get(name))
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new HttpError(400, `Invalid ${name}`, `${name} must be a number between ${min} and ${max}.`)
  }
  return value
}

function dateParam(params, name) {
  if (!params.has(name) || params.get(name) === '') return null
  const value = new Date(params.get(name))
  if (Number.isNaN(value.getTime())) {
    throw new HttpError(400, `Invalid ${name}`, `${name} must be an ISO 8601 date-time.`)
  }
  return value.toISOString()
}

// ---------- Cursor pagination ----------
// The cursor is opaque: base64url of { k: last sort key, id: last id }, so it keeps working whatever the sort.

const encodeCursor = (key, id) => Buffer.from(JSON.stringify({ k: key, id })).toString('base64url')

function decodeCursor(params) {
  const raw = params.get('cursor')
  if (!raw) return null
  try {
    const cursor = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
    if (UUID.test(cursor.id) && 'k' in cursor) return cursor
  } catch {
    // fall through to the error below
  }
  throw new HttpError(400, 'Invalid cursor', 'cursor must be a value returned in nextCursor.')
}

function page(rows, limit, toItem) {
  const visible = rows.slice(0, limit)
  const last = visible.at(-1)
  return {
    items: visible.map(toItem),
    nextCursor: rows.length > limit ? encodeCursor(last.sort_key, last.id) : null,
    total: rows.length ? Number(rows[0].total) : 0,
  }
}

// Collects SQL conditions with numbered parameters.
function queryBuilder() {
  const values = []
  const conditions = []
  return {
    values,
    conditions,
    param(value) {
      values.push(value)
      return `$${values.length}`
    },
    where(sql) {
      conditions.push(sql)
    },
    clause: () => (conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''),
  }
}

const money = (amount) => (amount === null || amount === undefined ? null : { amount: Number(amount), currency: 'EUR' })

// ---------- Fighters ----------

function toFighter(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    city: row.city,
    disciplines: row.disciplines,
    weightClass: row.weight_class,
    weightKg: Number(row.weight_kg),
    declaredLevel: row.declared_level,
    record: { wins: row.wins, losses: row.losses, draws: row.draws },
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: row.review_count ?? 0,
    rates: Object.fromEntries(Object.entries(row.rates ?? {}).map(([pkg, amount]) => [pkg, money(amount)])),
    priceFrom: money(row.min_rate),
    bio: row.bio,
  }
}

const FIGHTER_COLUMNS = `
  f.id, f.display_name, f.first_name, f.last_name, f.city, f.disciplines, f.weight_class,
  f.weight_kg, f.declared_level, f.wins, f.losses, f.draws, f.rating, f.review_count, f.bio,
  rates.rates, rates.min_rate`

const FIGHTER_RATES = `
  LEFT JOIN LATERAL (
    SELECT json_object_agg(r.package, r.amount_cents) AS rates, min(r.amount_cents) AS min_rate
    FROM fighter_rates r WHERE r.fighter_id = f.id
  ) rates ON true`

// Sort key expression, direction and the SQL type used to compare cursor values.
// Missing ratings sort last; fighters without rates sort last by price.
const FIGHTER_SORTS = {
  default: { key: 'f.id::text', dir: 'ASC', type: 'text' },
  rating: { key: 'coalesce(f.rating, 0)', dir: 'DESC', type: 'numeric' },
  price: { key: 'coalesce(rates.min_rate, 2147483647)', dir: 'ASC', type: 'integer' },
  name: { key: 'lower(f.display_name)', dir: 'ASC', type: 'text' },
}

// GET /api/fighters?city=&discipline=&weightClass=&minRating=&maxPrice=&sort=&limit=&cursor=
// BR-2: only approved fighters are listed. maxPrice is in cents and applies to the lowest package rate.
async function listFighters(params) {
  const limit = integerParam(params, 'limit', { min: 1, max: 100, fallback: 20 })
  const minRating = numberParam(params, 'minRating', { min: 0, max: 5 })
  const maxPrice = integerParam(params, 'maxPrice', { min: 0, fallback: null })
  const sortName = params.get('sort') || 'default'
  const sort = FIGHTER_SORTS[sortName]
  if (!sort) {
    throw new HttpError(400, 'Invalid sort', `sort must be one of: ${Object.keys(FIGHTER_SORTS).filter((s) => s !== 'default').join(', ')}.`)
  }
  const cursor = decodeCursor(params)

  const q = queryBuilder()
  q.where(`f.status = 'APPROVED'`)
  if (params.get('city')) q.where(`lower(f.city) = lower(${q.param(params.get('city'))})`)
  if (params.get('discipline')) q.where(`${q.param(params.get('discipline').toUpperCase())} = ANY (f.disciplines)`)
  if (params.get('weightClass')) q.where(`f.weight_class::text = ${q.param(params.get('weightClass').toUpperCase())}`)
  if (minRating !== null) q.where(`f.rating >= ${q.param(minRating)}`)
  if (maxPrice !== null) q.where(`rates.min_rate <= ${q.param(maxPrice)}`)

  // The total counts every match; the cursor condition only narrows the page.
  const op = sort.dir === 'ASC' ? '>' : '<'
  const after = cursor
    ? `WHERE (t.sort_key ${op} ${q.param(cursor.k)}::${sort.type}
          OR (t.sort_key = ${q.param(cursor.k)}::${sort.type} AND t.id > ${q.param(cursor.id)}::uuid))`
    : ''
  const limitParam = q.param(limit + 1)

  const { rows } = await catalogue.query(
    `SELECT * FROM (
       SELECT ${FIGHTER_COLUMNS}, ${sort.key} AS sort_key, count(*) OVER () AS total
       FROM fighters f ${FIGHTER_RATES}
       ${q.clause()}
     ) t
     ${after}
     ORDER BY t.sort_key ${sort.dir}, t.id ASC
     LIMIT ${limitParam}`,
    q.values,
  )
  return page(rows, limit, toFighter)
}

// GET /api/fighters/{id}: profile with upcoming availability and the latest reviews (US-C3).
async function getFighter(id) {
  if (!UUID.test(id)) throw notFound('Fighter')
  const { rows } = await catalogue.query(
    `SELECT ${FIGHTER_COLUMNS} FROM fighters f ${FIGHTER_RATES} WHERE f.id = $1 AND f.status = 'APPROVED'`,
    [id],
  )
  if (!rows.length) throw notFound('Fighter')

  const [availability, reviews] = await Promise.all([
    catalogue.query(
      `SELECT id, lower(period) AS starts_at, upper(period) AS ends_at
       FROM availability
       WHERE fighter_id = $1 AND status = 'AVAILABLE' AND lower(period) > now()
       ORDER BY lower(period) LIMIT 8`,
      [id],
    ),
    // Reviews only exist for completed services (US-C10), so all of them are shown.
    catalogue.query(
      `SELECT id, rating, comment, created_at FROM reviews WHERE fighter_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [id],
    ),
  ])

  return {
    ...toFighter(rows[0]),
    upcomingAvailability: availability.rows.map((row) => ({ id: row.id, startsAt: row.starts_at, endsAt: row.ends_at })),
    reviews: reviews.rows.map((row) => ({ id: row.id, rating: row.rating, comment: row.comment, createdAt: row.created_at })),
  }
}

// ---------- Venues ----------

function toVenue(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    postalCode: row.postal_code,
    city: row.city,
    capacity: row.capacity,
    disciplines: row.disciplines,
    upcomingSlots: row.upcoming_slots,
    priceFrom: money(row.price_from),
  }
}

// A slot is free when it is open, in the future and not held by an order.
const FREE_SLOT = `
  s.status = 'OPEN' AND lower(s.period) > now()
  AND NOT EXISTS (SELECT 1 FROM holds h WHERE h.slot_id = s.id AND h.status IN ('HELD', 'CONFIRMED'))`

const VENUE_SELECT = `
  SELECT v.id, v.name, v.address, v.postal_code, v.city, v.capacity, v.disciplines,
         count(s.id)::int AS upcoming_slots, min(s.price_cents) AS price_from
  FROM venues v
  LEFT JOIN slots s ON s.venue_id = v.id AND ${FREE_SLOT}`

// GET /api/venues?city=&discipline=&limit=&cursor=
async function listVenues(params) {
  const limit = integerParam(params, 'limit', { min: 1, max: 100, fallback: 20 })
  const cursor = decodeCursor(params)
  const q = queryBuilder()
  if (params.get('city')) q.where(`lower(v.city) = lower(${q.param(params.get('city'))})`)
  if (params.get('discipline')) q.where(`${q.param(params.get('discipline').toUpperCase())} = ANY (v.disciplines)`)
  const after = cursor ? `WHERE t.id > ${q.param(cursor.id)}::uuid` : ''
  const limitParam = q.param(limit + 1)

  const { rows } = await venues.query(
    `SELECT * FROM (
       SELECT x.*, x.id::text AS sort_key, count(*) OVER () AS total FROM (
         ${VENUE_SELECT} ${q.clause()} GROUP BY v.id
       ) x
     ) t
     ${after}
     ORDER BY t.id
     LIMIT ${limitParam}`,
    q.values,
  )
  return page(rows, limit, toVenue)
}

// GET /api/venues/{id}
async function getVenue(id) {
  if (!UUID.test(id)) throw notFound('Venue')
  const { rows } = await venues.query(`${VENUE_SELECT} WHERE v.id = $1 GROUP BY v.id`, [id])
  if (!rows.length) throw notFound('Venue')
  return toVenue(rows[0])
}

// GET /api/venues/{id}/slots?from=&to=&limit=&cursor=
// Upcoming open slots in time order; `available` is false when an order holds the slot.
async function listSlots(id, params) {
  if (!UUID.test(id)) throw notFound('Venue')
  const limit = integerParam(params, 'limit', { min: 1, max: 100, fallback: 50 })
  const from = dateParam(params, 'from')
  const to = dateParam(params, 'to')
  const cursor = decodeCursor(params)

  const exists = await venues.query('SELECT 1 FROM venues WHERE id = $1', [id])
  if (!exists.rows.length) throw notFound('Venue')

  const q = queryBuilder()
  q.where(`s.venue_id = ${q.param(id)}`)
  q.where(`s.status = 'OPEN'`)
  q.where(`lower(s.period) > ${from ? `${q.param(from)}::timestamptz` : 'now()'}`)
  if (to) q.where(`lower(s.period) < ${q.param(to)}::timestamptz`)
  const after = cursor
    ? `WHERE (t.sort_key > ${q.param(cursor.k)}::timestamptz
          OR (t.sort_key = ${q.param(cursor.k)}::timestamptz AND t.id > ${q.param(cursor.id)}::uuid))`
    : ''
  const limitParam = q.param(limit + 1)

  const { rows } = await venues.query(
    `SELECT * FROM (
       SELECT s.id, lower(s.period) AS sort_key, upper(s.period) AS ends_at, s.price_cents,
              NOT EXISTS (SELECT 1 FROM holds h WHERE h.slot_id = s.id AND h.status IN ('HELD', 'CONFIRMED')) AS available,
              count(*) OVER () AS total
       FROM slots s ${q.clause()}
     ) t
     ${after}
     ORDER BY t.sort_key, t.id
     LIMIT ${limitParam}`,
    q.values,
  )
  // sort_key is a Date; keep it as an ISO string in the cursor.
  const normalised = rows.map((row) => ({ ...row, sort_key: new Date(row.sort_key).toISOString() }))
  return page(normalised, limit, (row) => ({
    id: row.id,
    startsAt: row.sort_key,
    endsAt: row.ends_at,
    price: money(row.price_cents),
    available: row.available,
  }))
}

// ---------- Routing ----------

function route(handler) {
  return async (request, response, next) => {
    if (request.method !== 'GET') return next()
    try {
      const url = new URL(request.url, 'http://localhost')
      const segments = url.pathname.split('/').filter(Boolean)
      sendJson(response, 200, await handler(segments, url.searchParams))
    } catch (error) {
      sendProblem(response, error)
    }
  }
}

const unknownEndpoint = () => new HttpError(404, 'Not found', 'Unknown endpoint.')

// Mounted by vite.config.js. Connect strips the mount path, so segments are what follows it.
export function registerApi(middlewares) {
  middlewares.use('/api/health', (_request, response) => sendJson(response, 200, { status: 'ok' }))

  middlewares.use('/api/fighters', route(([id, extra], params) => {
    if (extra) throw unknownEndpoint()
    return id ? getFighter(id) : listFighters(params)
  }))

  middlewares.use('/api/venues', route(([id, sub, extra], params) => {
    if (!id) return listVenues(params)
    if (!sub) return getVenue(id)
    if (sub === 'slots' && !extra) return listSlots(id, params)
    throw unknownEndpoint()
  }))
}
