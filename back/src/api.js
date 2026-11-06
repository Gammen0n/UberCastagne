import { catalogue, venues } from './db.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class HttpError extends Error {
  constructor(status, title, detail) {
    super(detail)
    this.status = status
    this.title = title
  }
}

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

// Cursor pagination: limit 1-100 (default 20), cursor = last id of the previous page.
function pagination(params) {
  const limit = params.has('limit') ? Number(params.get('limit')) : 20
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, 'Invalid limit', 'limit must be an integer between 1 and 100.')
  }
  const cursor = params.get('cursor')
  if (cursor !== null && !UUID.test(cursor)) {
    throw new HttpError(400, 'Invalid cursor', 'cursor must be a value returned in nextCursor.')
  }
  return { limit, cursor }
}

function page(rows, limit) {
  const items = rows.slice(0, limit)
  return { items, nextCursor: rows.length > limit ? items.at(-1).id : null }
}

const money = (amount) => (amount === null ? null : { amount, currency: 'EUR' })

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
    rates: Object.fromEntries(Object.entries(row.rates ?? {}).map(([pkg, amount]) => [pkg, money(amount)])),
    bio: row.bio,
  }
}

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

// Builds "WHERE a AND b" with numbered parameters.
function where(conditions) {
  return conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
}

const FIGHTER_COLUMNS = `
  f.id, f.display_name, f.first_name, f.last_name, f.city, f.disciplines, f.weight_class,
  f.weight_kg, f.declared_level, f.wins, f.losses, f.draws, f.rating, f.bio,
  (SELECT json_object_agg(r.package, r.amount_cents) FROM fighter_rates r WHERE r.fighter_id = f.id) AS rates`

// GET /api/fighters?city=&discipline=&weightClass=&limit=&cursor=
// BR-2: only approved fighters are listed.
async function listFighters(params) {
  const { limit, cursor } = pagination(params)
  const values = []
  const conditions = [`f.status = 'APPROVED'`]
  const add = (sql, value) => {
    values.push(value)
    conditions.push(sql.replace('?', `$${values.length}`))
  }

  if (params.get('city')) add('lower(f.city) = lower(?)', params.get('city'))
  if (params.get('discipline')) add('? = ANY (f.disciplines)', params.get('discipline').toUpperCase())
  if (params.get('weightClass')) add('f.weight_class::text = ?', params.get('weightClass').toUpperCase())
  if (cursor) add('f.id > ?', cursor)
  values.push(limit + 1)

  const { rows } = await catalogue.query(
    `SELECT ${FIGHTER_COLUMNS} FROM fighters f ${where(conditions)} ORDER BY f.id LIMIT $${values.length}`,
    values,
  )
  return page(rows.map(toFighter), limit)
}

// GET /api/fighters/{id}
async function getFighter(id) {
  if (!UUID.test(id)) throw new HttpError(404, 'Fighter not found', 'No fighter matches this id.')
  const { rows } = await catalogue.query(
    `SELECT ${FIGHTER_COLUMNS} FROM fighters f WHERE f.id = $1 AND f.status = 'APPROVED'`,
    [id],
  )
  if (!rows.length) throw new HttpError(404, 'Fighter not found', 'No fighter matches this id.')
  return toFighter(rows[0])
}

// GET /api/venues?city=&discipline=&limit=&cursor=
async function listVenues(params) {
  const { limit, cursor } = pagination(params)
  const values = []
  const conditions = []
  const add = (sql, value) => {
    values.push(value)
    conditions.push(sql.replace('?', `$${values.length}`))
  }

  if (params.get('city')) add('lower(v.city) = lower(?)', params.get('city'))
  if (params.get('discipline')) add('? = ANY (v.disciplines)', params.get('discipline').toUpperCase())
  if (cursor) add('v.id > ?', cursor)
  values.push(limit + 1)

  // Upcoming slots that are open and not held by an order.
  const { rows } = await venues.query(
    `SELECT v.id, v.name, v.address, v.postal_code, v.city, v.capacity, v.disciplines,
            count(s.id)::int AS upcoming_slots, min(s.price_cents) AS price_from
     FROM venues v
     LEFT JOIN slots s ON s.venue_id = v.id
       AND s.status = 'OPEN'
       AND lower(s.period) > now()
       AND NOT EXISTS (SELECT 1 FROM holds h WHERE h.slot_id = s.id AND h.status IN ('HELD', 'CONFIRMED'))
     ${where(conditions)}
     GROUP BY v.id
     ORDER BY v.id
     LIMIT $${values.length}`,
    values,
  )
  return page(rows.map(toVenue), limit)
}

function route(handler) {
  return async (request, response, next) => {
    if (request.method !== 'GET') return next()
    try {
      const url = new URL(request.url, 'http://localhost')
      sendJson(response, 200, await handler(url))
    } catch (error) {
      sendProblem(response, error)
    }
  }
}

// Mounted by vite.config.js. Connect strips the mount path, so url.pathname is "/" or "/{id}".
export function registerApi(middlewares) {
  middlewares.use('/api/health', (_request, response) => sendJson(response, 200, { status: 'ok' }))

  middlewares.use('/api/fighters', route((url) => {
    const id = url.pathname.slice(1)
    return id ? getFighter(id) : listFighters(url.searchParams)
  }))

  middlewares.use('/api/venues', route((url) => {
    if (url.pathname !== '/') throw new HttpError(404, 'Not found', 'Unknown venues endpoint.')
    return listVenues(url.searchParams)
  }))
}
